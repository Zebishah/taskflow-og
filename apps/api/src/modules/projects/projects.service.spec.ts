import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import type {
  Project,
  Workspace,
  WorkspaceMember,
} from '../../database/schema';
import { CacheService } from '../../infrastructure/cache/cache.service';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;

  let repository: {
    create: jest.MockedFunction<ProjectsRepository['create']>;
    findAll: jest.MockedFunction<ProjectsRepository['findAll']>;
    findById: jest.MockedFunction<ProjectsRepository['findById']>;
    findByKey: jest.MockedFunction<ProjectsRepository['findByKey']>;
    update: jest.MockedFunction<ProjectsRepository['update']>;
    archive: jest.MockedFunction<ProjectsRepository['archive']>;
    restore: jest.MockedFunction<ProjectsRepository['restore']>;
  };

  const now = new Date('2026-07-22T10:00:00.000Z');

  const workspace: Workspace = {
    id: '6eea0d06-9ebb-492b-820c-6f08638e5eef',
    name: 'TaskFlow',
    slug: 'taskflow',
    description: null,
    createdAt: now,
    updatedAt: now,
  };

  const ownerMembership: WorkspaceMember = {
    id: '8c872ad6-c359-4e5e-b645-ae2944043750',
    workspaceId: workspace.id,
    userId: '2e01067b-0ae0-431c-8833-d7b2d77518f0',
    role: 'owner',
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const adminMembership: WorkspaceMember = {
    ...ownerMembership,
    id: '97da5511-d500-4d53-9c98-b91c22a41f3e',
    userId: '86e9d8bf-cfca-46a9-a389-1712f49f7c51',
    role: 'admin',
  };

  const memberMembership: WorkspaceMember = {
    ...ownerMembership,
    id: '9efa7346-64ab-47a8-9efd-91f5f876e46a',
    userId: 'b772ed51-e323-4aef-969f-b964afda46e3',
    role: 'member',
  };

  const ownerContext: WorkspaceMembershipContext = {
    workspace,
    membership: ownerMembership,
  };

  const adminContext: WorkspaceMembershipContext = {
    workspace,
    membership: adminMembership,
  };

  const memberContext: WorkspaceMembershipContext = {
    workspace,
    membership: memberMembership,
  };

  const activeProject: Project = {
    id: 'da135c51-3f2e-4b59-b737-fc92a0e650b5',
    workspaceId: workspace.id,
    createdByUserId: ownerMembership.userId,
    name: 'Website Redesign',
    key: 'WEB',
    description: 'Redesign the website',
    nextTaskNumber: 1,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const archivedProject: Project = {
    ...activeProject,
    archivedAt: new Date('2026-07-23T10:00:00.000Z'),
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByKey: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      restore: jest.fn(),
    };

    const moduleReference = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: ProjectsRepository,
          useValue: repository,
        },
        {
          provide: CacheService,
          useValue: {
            getJson: jest.fn().mockResolvedValue(null),
            setJson: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = moduleReference.get(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a normalized project for an owner', async () => {
      repository.findByKey.mockResolvedValue(null);

      repository.create.mockResolvedValue(activeProject);

      const result = await service.create(ownerContext, {
        name: '  Website Redesign  ',
        key: ' web ',
        description: '  Redesign the website  ',
      });

      expect(repository.findByKey).toHaveBeenCalledWith(workspace.id, 'WEB');

      expect(repository.create).toHaveBeenCalledWith({
        workspaceId: workspace.id,
        createdByUserId: ownerMembership.userId,
        name: 'Website Redesign',
        key: 'WEB',
        description: 'Redesign the website',
      });

      expect(result).toEqual(activeProject);
    });

    it('allows an administrator to create a project', async () => {
      repository.findByKey.mockResolvedValue(null);

      repository.create.mockResolvedValue({
        ...activeProject,
        createdByUserId: adminMembership.userId,
      });

      await expect(
        service.create(adminContext, {
          name: 'API',
          key: 'API',
        }),
      ).resolves.toBeDefined();
    });

    it('rejects an ordinary member', async () => {
      await expect(
        service.create(memberContext, {
          name: 'Website Redesign',
          key: 'WEB',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.findByKey).not.toHaveBeenCalled();

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('converts an empty description to null', async () => {
      repository.findByKey.mockResolvedValue(null);

      repository.create.mockResolvedValue({
        ...activeProject,
        description: null,
      });

      await service.create(ownerContext, {
        name: 'Website Redesign',
        key: 'WEB',
        description: '   ',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
        }),
      );
    });

    it('rejects a duplicate project key', async () => {
      repository.findByKey.mockResolvedValue(activeProject);

      await expect(
        service.create(ownerContext, {
          name: 'Another Website',
          key: 'WEB',
        }),
      ).rejects.toThrow(ConflictException);

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('converts a wrapped PostgreSQL unique error into ConflictException', async () => {
      repository.findByKey.mockResolvedValue(null);

      repository.create.mockRejectedValue({
        cause: {
          code: '23505',
        },
      });

      await expect(
        service.create(ownerContext, {
          name: 'Website',
          key: 'WEB',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows unexpected database errors', async () => {
      const databaseError = new Error('Database unavailable');

      repository.findByKey.mockResolvedValue(null);

      repository.create.mockRejectedValue(databaseError);

      await expect(
        service.create(ownerContext, {
          name: 'Website',
          key: 'WEB',
        }),
      ).rejects.toBe(databaseError);
    });
  });

  describe('findAll', () => {
    it('returns projects from the current workspace', async () => {
      repository.findAll.mockResolvedValue([activeProject]);

      const result = await service.findAll(memberContext);

      expect(repository.findAll).toHaveBeenCalledWith(workspace.id);

      expect(result).toEqual([activeProject]);
    });
  });

  describe('findOne', () => {
    it('returns a project belonging to the workspace', async () => {
      repository.findById.mockResolvedValue(activeProject);

      await expect(
        service.findOne(memberContext, activeProject.id),
      ).resolves.toEqual(activeProject);

      expect(repository.findById).toHaveBeenCalledWith(
        workspace.id,
        activeProject.id,
      );
    });

    it('throws NotFoundException when project is absent', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.findOne(memberContext, activeProject.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('allows an owner to update an active project', async () => {
      const updatedProject: Project = {
        ...activeProject,
        name: 'TaskFlow Website',
        description: 'New description',
      };

      repository.findById.mockResolvedValue(activeProject);

      repository.update.mockResolvedValue(updatedProject);

      const result = await service.update(ownerContext, activeProject.id, {
        name: ' TaskFlow Website ',
        description: ' New description ',
      });

      expect(repository.update).toHaveBeenCalledWith(
        workspace.id,
        activeProject.id,
        {
          name: 'TaskFlow Website',
          description: 'New description',
        },
      );

      expect(result).toEqual(updatedProject);
    });

    it('rejects an ordinary member', async () => {
      await expect(
        service.update(memberContext, activeProject.id, {
          name: 'Changed',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.findById).not.toHaveBeenCalled();
    });

    it('rejects updates to archived projects', async () => {
      repository.findById.mockResolvedValue(archivedProject);

      await expect(
        service.update(ownerContext, archivedProject.id, {
          name: 'Changed',
        }),
      ).rejects.toThrow(ConflictException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rejects changing to an existing key', async () => {
      repository.findById.mockResolvedValue(activeProject);

      repository.findByKey.mockResolvedValue({
        ...activeProject,
        id: '76687cfb-54be-41c0-946d-2ce05788ecaa',
        key: 'API',
      });

      await expect(
        service.update(ownerContext, activeProject.id, {
          key: 'api',
        }),
      ).rejects.toThrow(ConflictException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('does not query duplicate key when key did not change', async () => {
      repository.findById.mockResolvedValue(activeProject);

      repository.update.mockResolvedValue(activeProject);

      await service.update(ownerContext, activeProject.id, {
        key: 'web',
      });

      expect(repository.findByKey).not.toHaveBeenCalled();
    });

    it('returns existing project for an empty update', async () => {
      repository.findById.mockResolvedValue(activeProject);

      const result = await service.update(ownerContext, activeProject.id, {});

      expect(result).toEqual(activeProject);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('archives an active project', async () => {
      repository.findById.mockResolvedValue(activeProject);

      repository.archive.mockResolvedValue(archivedProject);

      await expect(
        service.archive(ownerContext, activeProject.id),
      ).resolves.toBeUndefined();

      expect(repository.archive).toHaveBeenCalledWith(
        workspace.id,
        activeProject.id,
      );
    });

    it('rejects an ordinary member', async () => {
      await expect(
        service.archive(memberContext, activeProject.id),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.archive).not.toHaveBeenCalled();
    });

    it('rejects an already archived project', async () => {
      repository.findById.mockResolvedValue(archivedProject);

      await expect(
        service.archive(ownerContext, archivedProject.id),
      ).rejects.toThrow(ConflictException);

      expect(repository.archive).not.toHaveBeenCalled();
    });

    it('handles a concurrent archive safely', async () => {
      repository.findById.mockResolvedValue(activeProject);

      repository.archive.mockResolvedValue(null);

      await expect(
        service.archive(ownerContext, activeProject.id),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('restore', () => {
    it('restores an archived project', async () => {
      repository.findById.mockResolvedValue(archivedProject);

      repository.restore.mockResolvedValue(activeProject);

      await expect(
        service.restore(adminContext, archivedProject.id),
      ).resolves.toEqual(activeProject);

      expect(repository.restore).toHaveBeenCalledWith(
        workspace.id,
        archivedProject.id,
      );
    });

    it('rejects restoring an active project', async () => {
      repository.findById.mockResolvedValue(activeProject);

      await expect(
        service.restore(ownerContext, activeProject.id),
      ).rejects.toThrow(ConflictException);

      expect(repository.restore).not.toHaveBeenCalled();
    });

    it('rejects an ordinary member', async () => {
      await expect(
        service.restore(memberContext, archivedProject.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
