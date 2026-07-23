import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';

import { DATABASE } from '../src/database/database.constants';
import { DatabaseModule } from '../src/database/database.module';
import type { Database } from '../src/database/database.types';
import {
  projects,
  tasks,
  users,
  workspaceMembers,
  workspaces,
  type Project,
  type User,
} from '../src/database/schema';
import type { WorkspaceMembershipContext } from '../src/modules/workspaces/workspaces.types';
import { TasksRepository } from '../src/modules/tasks/tasks.repository';
import { TasksService } from '../src/modules/tasks/tasks.service';
describe('Tasks integration', () => {
  let database: Database;
  let service: TasksService;
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
     * These tests insert and delete real database rows.
     * This protection prevents them from accidentally
     * running against development or production.
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
      providers: [TasksRepository, TasksService],
    }).compile();

    database = moduleReference.get<Database>(DATABASE);

    service = moduleReference.get(TasksService);
  });

  afterEach(async () => {
    /*
     * Deleting a workspace automatically deletes:
     *
     * - workspace memberships
     * - projects
     * - tasks
     *
     * because their foreign keys use ON DELETE CASCADE.
     */
    for (const workspaceId of createdWorkspaceIds) {
      await database.delete(workspaces).where(eq(workspaces.id, workspaceId));
    }

    /*
     * Users must be deleted after workspaces because
     * projects and tasks reference their creators.
     */
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

  async function createUser(identifier: string): Promise<User> {
    const [user] = await database
      .insert(users)
      .values({
        email: `${identifier}-${Date.now()}-` + `${Math.random()}@example.com`,
        passwordHash: 'integration-test-password-hash',
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
    const uniqueSuffix =
      `${Date.now()}-` + Math.random().toString(36).slice(2, 10);

    const [workspace] = await database
      .insert(workspaces)
      .values({
        name: `${identifier} Workspace`,
        slug: `${identifier}-${uniqueSuffix}`,
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

  async function addWorkspaceMember(
    workspaceId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member',
  ) {
    const [membership] = await database
      .insert(workspaceMembers)
      .values({
        workspaceId,
        userId,
        role,
      })
      .returning();

    if (!membership) {
      throw new Error('Integration membership was not created');
    }

    return membership;
  }

  async function createProject(
    context: WorkspaceMembershipContext,
    identifier: string,
  ): Promise<Project> {
    const projectKey = identifier
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 10)
      .toUpperCase();

    const [project] = await database
      .insert(projects)
      .values({
        workspaceId: context.workspace.id,
        createdByUserId: context.membership.userId,
        name: `${identifier} Project`,
        key: projectKey,
        description: null,
      })
      .returning();

    if (!project) {
      throw new Error('Integration project was not created');
    }

    return project;
  }

  describe('create', () => {
    it('creates a real task in PostgreSQL', async () => {
      const owner = await createUser('create-task-owner');

      const context = await createWorkspaceContext(
        owner.id,
        'owner',
        'create-task',
      );

      const project = await createProject(context, 'CREATE');

      const task = await service.create(context, project.id, {
        title: '  Build login page  ',
        description: '  Build the authentication UI  ',
        status: 'todo',
        priority: 'high',
        dueAt: '2026-08-01T12:00:00.000Z',
      });

      expect(task.id).toBeDefined();

      expect(task.workspaceId).toBe(context.workspace.id);

      expect(task.projectId).toBe(project.id);

      expect(task.createdByUserId).toBe(owner.id);

      expect(task.taskNumber).toBe(1);
      expect(task.title).toBe('Build login page');

      expect(task.description).toBe('Build the authentication UI');

      expect(task.status).toBe('todo');
      expect(task.priority).toBe('high');
      expect(task.position).toBe(1000);

      expect(task.dueAt?.toISOString()).toBe('2026-08-01T12:00:00.000Z');

      const [databaseTask] = await database
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id))
        .limit(1);

      expect(databaseTask).toEqual(task);
    });

    it('creates sequential task numbers safely', async () => {
      const owner = await createUser('task-number-owner');

      const context = await createWorkspaceContext(
        owner.id,
        'owner',
        'task-number',
      );

      const project = await createProject(context, 'NUMBER');

      const firstTask = await service.create(context, project.id, {
        title: 'First task',
      });

      const secondTask = await service.create(context, project.id, {
        title: 'Second task',
      });

      expect(firstTask.taskNumber).toBe(1);
      expect(secondTask.taskNumber).toBe(2);

      expect(firstTask.position).toBe(1000);
      expect(secondTask.position).toBe(2000);

      const [updatedProject] = await database
        .select()
        .from(projects)
        .where(eq(projects.id, project.id))
        .limit(1);

      expect(updatedProject?.nextTaskNumber).toBe(3);
    });

    it('allows assigning a workspace member', async () => {
      const owner = await createUser('assignment-owner');

      const assignedUser = await createUser('assigned-user');

      const context = await createWorkspaceContext(
        owner.id,
        'owner',
        'assignment',
      );

      const assigneeMembership = await addWorkspaceMember(
        context.workspace.id,
        assignedUser.id,
        'member',
      );

      const project = await createProject(context, 'ASSIGN');

      const task = await service.create(context, project.id, {
        title: 'Assigned task',
        assigneeMemberId: assigneeMembership.id,
      });

      expect(task.assigneeMemberId).toBe(assigneeMembership.id);
    });

    it('rejects an assignee from another workspace', async () => {
      const firstOwner = await createUser('first-workspace-owner');

      const secondOwner = await createUser('second-workspace-owner');

      const firstContext = await createWorkspaceContext(
        firstOwner.id,
        'owner',
        'first-workspace',
      );

      const secondContext = await createWorkspaceContext(
        secondOwner.id,
        'owner',
        'second-workspace',
      );

      const project = await createProject(firstContext, 'FIRST');

      await expect(
        service.create(firstContext, project.id, {
          title: 'Invalid assignment',
          assigneeMemberId: secondContext.membership.id,
        }),
      ).rejects.toThrow(NotFoundException);

      const projectTasks = await database
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, project.id));

      expect(projectTasks).toHaveLength(0);
    });

    it('rejects creating tasks in an archived project', async () => {
      const owner = await createUser('archived-project-owner');

      const context = await createWorkspaceContext(
        owner.id,
        'owner',
        'archived-project',
      );

      const project = await createProject(context, 'ARCHIVE');

      await database
        .update(projects)
        .set({
          archivedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projects.id, project.id));

      await expect(
        service.create(context, project.id, {
          title: 'Should not exist',
        }),
      ).rejects.toThrow(ConflictException);

      const projectTasks = await database
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, project.id));

      expect(projectTasks).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('returns only tasks from the requested project', async () => {
      const owner = await createUser('list-tasks-owner');

      const context = await createWorkspaceContext(
        owner.id,
        'owner',
        'list-tasks',
      );

      const firstProject = await createProject(context, 'FIRST');

      const secondProject = await createProject(context, 'SECOND');

      await service.create(context, firstProject.id, {
        title: 'First project task',
      });

      await service.create(context, secondProject.id, {
        title: 'Second project task',
      });

      const result = await service.findAll(context, firstProject.id, {});

      expect(result).toHaveLength(1);

      expect(result[0]?.title).toBe('First project task');

      expect(result[0]?.projectId).toBe(firstProject.id);
    });

    it('filters tasks by status and priority', async () => {
      const owner = await createUser('filter-tasks-owner');

      const context = await createWorkspaceContext(
        owner.id,
        'owner',
        'filter-tasks',
      );

      const project = await createProject(context, 'FILTER');

      await service.create(context, project.id, {
        title: 'Urgent active task',
        status: 'in_progress',
        priority: 'urgent',
      });

      await service.create(context, project.id, {
        title: 'Normal todo task',
        status: 'todo',
        priority: 'medium',
      });

      const result = await service.findAll(context, project.id, {
        status: 'in_progress',
        priority: 'urgent',
      });

      expect(result).toHaveLength(1);

      expect(result[0]?.title).toBe('Urgent active task');
    });

    it('searches task titles case-insensitively', async () => {
      const owner = await createUser('search-tasks-owner');

      const context = await createWorkspaceContext(
        owner.id,
        'owner',
        'search-tasks',
      );

      const project = await createProject(context, 'SEARCH');

      await service.create(context, project.id, {
        title: 'Build authentication page',
      });

      await service.create(context, project.id, {
        title: 'Design dashboard',
      });

      const result = await service.findAll(context, project.id, {
        search: 'AUTHENTICATION',
      });

      expect(result).toHaveLength(1);

      expect(result[0]?.title).toBe('Build authentication page');
    });
  });

  describe('update', () => {
    it('updates a task in the real database', async () => {
      const owner = await createUser('update-task-owner');

      const context = await createWorkspaceContext(
        owner.id,
        'owner',
        'update-task',
      );

      const project = await createProject(context, 'UPDATE');

      const task = await service.create(context, project.id, {
        title: 'Original task',
        priority: 'low',
      });

      const updatedTask = await service.update(context, project.id, task.id, {
        title: 'Updated task',
        priority: 'high',
        status: 'in_progress',
      });

      expect(updatedTask.title).toBe('Updated task');

      expect(updatedTask.priority).toBe('high');

      expect(updatedTask.status).toBe('in_progress');

      const [databaseTask] = await database
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id))
        .limit(1);

      expect(databaseTask?.title).toBe('Updated task');

      expect(databaseTask?.priority).toBe('high');
    });

    it('sets completedAt when completing a task', async () => {
      const owner = await createUser('complete-task-owner');

      const context = await createWorkspaceContext(
        owner.id,
        'owner',
        'complete-task',
      );

      const project = await createProject(context, 'COMPLETE');

      const task = await service.create(context, project.id, {
        title: 'Complete this task',
      });

      const completedTask = await service.update(context, project.id, task.id, {
        status: 'done',
      });

      expect(completedTask.status).toBe('done');

      expect(completedTask.completedAt).toBeInstanceOf(Date);
    });

    it('clears completedAt when reopening a task', async () => {
      const owner = await createUser('reopen-task-owner');

      const context = await createWorkspaceContext(
        owner.id,
        'owner',
        'reopen-task',
      );

      const project = await createProject(context, 'REOPEN');

      const task = await service.create(context, project.id, {
        title: 'Reopen this task',
        status: 'done',
      });

      expect(task.completedAt).toBeInstanceOf(Date);

      const reopenedTask = await service.update(context, project.id, task.id, {
        status: 'in_progress',
      });

      expect(reopenedTask.status).toBe('in_progress');

      expect(reopenedTask.completedAt).toBeNull();
    });

    it('removes the assignee using null', async () => {
      const owner = await createUser('remove-assignee-owner');

      const memberUser = await createUser('remove-assignee-member');

      const context = await createWorkspaceContext(
        owner.id,
        'owner',
        'remove-assignee',
      );

      const membership = await addWorkspaceMember(
        context.workspace.id,
        memberUser.id,
        'member',
      );

      const project = await createProject(context, 'UNASSIGN');

      const task = await service.create(context, project.id, {
        title: 'Assigned task',
        assigneeMemberId: membership.id,
      });

      const updatedTask = await service.update(context, project.id, task.id, {
        assigneeMemberId: null,
      });

      expect(updatedTask.assigneeMemberId).toBeNull();
    });
  });

  describe('workspace isolation', () => {
    it('does not expose a task through another workspace context', async () => {
      const firstOwner = await createUser('isolation-first-owner');

      const secondOwner = await createUser('isolation-second-owner');

      const firstContext = await createWorkspaceContext(
        firstOwner.id,
        'owner',
        'isolation-first',
      );

      const secondContext = await createWorkspaceContext(
        secondOwner.id,
        'owner',
        'isolation-second',
      );

      const firstProject = await createProject(firstContext, 'ISOONE');

      const task = await service.create(firstContext, firstProject.id, {
        title: 'Private workspace task',
      });

      await expect(
        service.findOne(secondContext, firstProject.id, task.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('allows the owner to delete a task', async () => {
      const owner = await createUser('delete-task-owner');

      const context = await createWorkspaceContext(
        owner.id,
        'owner',
        'delete-task',
      );

      const project = await createProject(context, 'DELETE');

      const task = await service.create(context, project.id, {
        title: 'Delete this task',
      });

      await service.delete(context, project.id, task.id);

      const [databaseTask] = await database
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id))
        .limit(1);

      expect(databaseTask).toBeUndefined();
    });

    it('prevents an ordinary member from deleting a task', async () => {
      const owner = await createUser('member-delete-owner');

      const memberUser = await createUser('member-delete-user');

      const ownerContext = await createWorkspaceContext(
        owner.id,
        'owner',
        'member-delete',
      );

      const memberMembership = await addWorkspaceMember(
        ownerContext.workspace.id,
        memberUser.id,
        'member',
      );

      const memberContext: WorkspaceMembershipContext = {
        workspace: ownerContext.workspace,
        membership: memberMembership,
      };

      const project = await createProject(ownerContext, 'NODELETE');

      const task = await service.create(ownerContext, project.id, {
        title: 'Protected task',
      });

      await expect(
        service.delete(memberContext, project.id, task.id),
      ).rejects.toThrow(ForbiddenException);

      const [databaseTask] = await database
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id))
        .limit(1);

      expect(databaseTask).toBeDefined();
    });
  });
});
