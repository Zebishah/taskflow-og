import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';

import { DATABASE } from '../src/database/database.constants';
import { DatabaseModule } from '../src/database/database.module';
import type { Database } from '../src/database/database.types';
import {
  projects,
  users,
  workspaceMembers,
  workspaces,
  type Workspace,
  type WorkspaceMember,
} from '../src/database/schema';
import { ProjectsRepository } from '../src/modules/projects/projects.repository';
import { ProjectsService } from '../src/modules/projects/projects.service';
import type { WorkspaceMembershipContext } from '../src/modules/workspaces/workspaces.types';

describe('Projects integration', () => {
  let database: Database;
  let service: ProjectsService;
  let moduleReference: TestingModule;

  let originalDatabaseUrl: string | undefined;

  const createdWorkspaceIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const testDatabaseUrl = process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for integration tests');
    }

    const parsedDatabaseUrl = new URL(testDatabaseUrl);

    /*
     * Critical safety protection:
     * integration tests delete the data they create.
     * Never allow them to run against a database
     * without a name ending in "_test".
     */
    if (!parsedDatabaseUrl.pathname.endsWith('_test')) {
      throw new Error(
        'Integration tests require a database name ending in "_test"',
      );
    }

    originalDatabaseUrl = process.env.DATABASE_URL;

    process.env.DATABASE_URL = testDatabaseUrl;

    moduleReference = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
        }),
        DatabaseModule,
      ],
      providers: [ProjectsRepository, ProjectsService],
    }).compile();

    database = moduleReference.get<Database>(DATABASE);

    service = moduleReference.get(ProjectsService);
  });

  afterEach(async () => {
    /*
     * Deleting a workspace cascades to its
     * memberships and projects.
     */
    for (const workspaceId of createdWorkspaceIds) {
      await database.delete(workspaces).where(eq(workspaces.id, workspaceId));
    }

    for (const userId of createdUserIds) {
      await database.delete(users).where(eq(users.id, userId));
    }

    createdWorkspaceIds.length = 0;
    createdUserIds.length = 0;
  });

  afterAll(async () => {
    await moduleReference.close();

    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  async function createUser(identifier: string) {
    const [user] = await database
      .insert(users)
      .values({
        email: `${identifier}-${Date.now()}-${Math.random()}@example.com`,
        passwordHash: 'integration-test-hash',
        firstName: 'Integration',
        lastName: 'Tester',
        status: 'active',
      })
      .returning();

    if (!user) {
      throw new Error('Integration user was not created');
    }

    createdUserIds.push(user.id);

    return user;
  }

  async function createWorkspaceContext(
    userId: string,
    role: 'owner' | 'admin' | 'member',
    identifier: string,
  ): Promise<WorkspaceMembershipContext> {
    const [workspace] = await database
      .insert(workspaces)
      .values({
        name: `${identifier} Workspace`,
        slug:
          `${identifier}-${Date.now()}-` +
          Math.random().toString(36).slice(2, 10),
        description: null,
      })
      .returning();

    if (!workspace) {
      throw new Error('Integration workspace was not created');
    }

    createdWorkspaceIds.push(workspace.id);

    const [membership] = await database
      .insert(workspaceMembers)
      .values({
        workspaceId: workspace.id,
        userId,
        role,
      })
      .returning();

    if (!membership) {
      throw new Error('Integration membership was not created');
    }

    return {
      workspace,
      membership,
    };
  }

  async function createMembership(
    workspace: Workspace,
    userId: string,
    role: 'owner' | 'admin' | 'member',
  ): Promise<WorkspaceMember> {
    const [membership] = await database
      .insert(workspaceMembers)
      .values({
        workspaceId: workspace.id,
        userId,
        role,
      })
      .returning();

    if (!membership) {
      throw new Error('Integration membership was not created');
    }

    return membership;
  }

  it('creates and persists a normalized project', async () => {
    const user = await createUser('create-project');

    const context = await createWorkspaceContext(
      user.id,
      'owner',
      'create-project',
    );

    const project = await service.create(context, {
      name: '  Website Redesign  ',
      key: ' web ',
      description: '  Public website work  ',
    });

    expect(project).toMatchObject({
      workspaceId: context.workspace.id,
      createdByUserId: user.id,
      name: 'Website Redesign',
      key: 'WEB',
      description: 'Public website work',
      archivedAt: null,
    });

    const [storedProject] = await database
      .select()
      .from(projects)
      .where(eq(projects.id, project.id))
      .limit(1);

    expect(storedProject).toEqual(project);
  });

  it('prevents duplicate keys inside one workspace', async () => {
    const user = await createUser('duplicate-key');

    const context = await createWorkspaceContext(
      user.id,
      'owner',
      'duplicate-key',
    );

    await service.create(context, {
      name: 'Website',
      key: 'WEB',
    });

    await expect(
      service.create(context, {
        name: 'Another Website',
        key: 'web',
      }),
    ).rejects.toThrow(ConflictException);

    const storedProjects = await database
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, context.workspace.id));

    expect(storedProjects).toHaveLength(1);
  });

  it('allows the same key in different workspaces', async () => {
    const user = await createUser('workspace-keys');

    const firstContext = await createWorkspaceContext(
      user.id,
      'owner',
      'first-project',
    );

    const secondContext = await createWorkspaceContext(
      user.id,
      'owner',
      'second-project',
    );

    await expect(
      service.create(firstContext, {
        name: 'First Website',
        key: 'WEB',
      }),
    ).resolves.toBeDefined();

    await expect(
      service.create(secondContext, {
        name: 'Second Website',
        key: 'WEB',
      }),
    ).resolves.toBeDefined();
  });

  it('prevents members from creating projects', async () => {
    const owner = await createUser('permission-owner');

    const member = await createUser('permission-member');

    const ownerContext = await createWorkspaceContext(
      owner.id,
      'owner',
      'permission',
    );

    const memberMembership = await createMembership(
      ownerContext.workspace,
      member.id,
      'member',
    );

    const memberContext: WorkspaceMembershipContext = {
      workspace: ownerContext.workspace,
      membership: memberMembership,
    };

    await expect(
      service.create(memberContext, {
        name: 'Forbidden Project',
        key: 'NO',
      }),
    ).rejects.toThrow(ForbiddenException);

    const storedProjects = await database
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, ownerContext.workspace.id));

    expect(storedProjects).toHaveLength(0);
  });

  it('does not expose a project through another workspace', async () => {
    const user = await createUser('isolation');

    const firstContext = await createWorkspaceContext(
      user.id,
      'owner',
      'isolation-first',
    );

    const secondContext = await createWorkspaceContext(
      user.id,
      'owner',
      'isolation-second',
    );

    const project = await service.create(firstContext, {
      name: 'Private Project',
      key: 'PRIVATE',
    });

    await expect(service.findOne(secondContext, project.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates an active project', async () => {
    const user = await createUser('update-project');

    const context = await createWorkspaceContext(
      user.id,
      'admin',
      'update-project',
    );

    const project = await service.create(context, {
      name: 'Original Name',
      key: 'OLD',
    });

    const updatedProject = await service.update(context, project.id, {
      name: 'Updated Name',
      key: 'NEW',
      description: 'Updated description',
    });

    expect(updatedProject).toMatchObject({
      name: 'Updated Name',
      key: 'NEW',
      description: 'Updated description',
    });
  });

  it('archives and restores a project', async () => {
    const user = await createUser('archive-project');

    const context = await createWorkspaceContext(
      user.id,
      'owner',
      'archive-project',
    );

    const project = await service.create(context, {
      name: 'Archive Project',
      key: 'ARCHIVE',
    });

    await service.archive(context, project.id);

    const archivedProject = await service.findOne(context, project.id);

    expect(archivedProject.archivedAt).toBeInstanceOf(Date);

    const restoredProject = await service.restore(context, project.id);

    expect(restoredProject.archivedAt).toBeNull();
  });

  it('deletes projects when their workspace is deleted', async () => {
    const user = await createUser('workspace-cascade');

    const context = await createWorkspaceContext(
      user.id,
      'owner',
      'workspace-cascade',
    );

    const project = await service.create(context, {
      name: 'Cascade Project',
      key: 'CASCADE',
    });

    await database
      .delete(workspaces)
      .where(eq(workspaces.id, context.workspace.id));

    const remainingProjects = await database
      .select()
      .from(projects)
      .where(eq(projects.id, project.id));

    expect(remainingProjects).toHaveLength(0);

    const trackedIndex = createdWorkspaceIds.indexOf(context.workspace.id);

    if (trackedIndex >= 0) {
      createdWorkspaceIds.splice(trackedIndex, 1);
    }
  });
});
