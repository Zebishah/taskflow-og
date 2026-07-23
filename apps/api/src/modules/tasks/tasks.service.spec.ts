import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import type {
  Project,
  Task,
  Workspace,
  WorkspaceMember,
} from '../../database/schema';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  let repository: {
    findProjectById: jest.MockedFunction<TasksRepository['findProjectById']>;
    membershipExists: jest.MockedFunction<TasksRepository['membershipExists']>;
    create: jest.MockedFunction<TasksRepository['create']>;
    findAll: jest.MockedFunction<TasksRepository['findAll']>;
    findById: jest.MockedFunction<TasksRepository['findById']>;
    update: jest.MockedFunction<TasksRepository['update']>;
    delete: jest.MockedFunction<TasksRepository['delete']>;
  };

  const now = new Date('2026-07-23T10:00:00.000Z');

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

  const memberContext: WorkspaceMembershipContext = {
    workspace,
    membership: memberMembership,
  };

  const project: Project = {
    id: 'da135c51-3f2e-4b59-b737-fc92a0e650b5',
    workspaceId: workspace.id,
    createdByUserId: ownerMembership.userId,
    name: 'Website',
    key: 'WEB',
    description: null,
    nextTaskNumber: 2,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const task: Task = {
    id: '15ca922e-d80f-47dd-83e6-d9f5393b398e',
    workspaceId: workspace.id,
    projectId: project.id,
    createdByUserId: ownerMembership.userId,
    assigneeMemberId: null,
    taskNumber: 1,
    title: 'Build login page',
    description: null,
    status: 'todo',
    priority: 'medium',
    position: 1000,
    dueAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(async () => {
    repository = {
      findProjectById: jest.fn(),
      membershipExists: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const moduleReference = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TasksRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = moduleReference.get(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a normalized task', async () => {
    repository.findProjectById.mockResolvedValue(project);
    repository.create.mockResolvedValue(task);

    const result = await service.create(ownerContext, project.id, {
      title: '  Build login page  ',
    });

    expect(repository.create).toHaveBeenCalledWith({
      workspaceId: workspace.id,
      projectId: project.id,
      createdByUserId: ownerMembership.userId,
      assigneeMemberId: null,
      title: 'Build login page',
      description: null,
      status: 'todo',
      priority: 'medium',
      dueAt: null,
    });

    expect(result).toEqual(task);
  });

  it('rejects an assignee from another workspace', async () => {
    repository.findProjectById.mockResolvedValue(project);
    repository.membershipExists.mockResolvedValue(false);

    await expect(
      service.create(ownerContext, project.id, {
        title: 'Build login page',
        assigneeMemberId: '97da5511-d500-4d53-9c98-b91c22a41f3e',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects task creation in an archived project', async () => {
    repository.findProjectById.mockResolvedValue({
      ...project,
      archivedAt: now,
    });

    await expect(
      service.create(ownerContext, project.id, {
        title: 'Build login page',
      }),
    ).rejects.toThrow(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('sets completedAt when moving a task to done', async () => {
    repository.findProjectById.mockResolvedValue(project);
    repository.findById.mockResolvedValue(task);
    repository.update.mockResolvedValue({
      ...task,
      status: 'done',
      completedAt: now,
    });

    await service.update(ownerContext, project.id, task.id, {
      status: 'done',
    });

    expect(repository.update).toHaveBeenCalledWith(
      workspace.id,
      project.id,
      task.id,
      expect.objectContaining({
        status: 'done',
        completedAt: now,
      }),
    );
  });

  it('clears completedAt when reopening a task', async () => {
    repository.findProjectById.mockResolvedValue(project);
    repository.findById.mockResolvedValue({
      ...task,
      status: 'done',
      completedAt: now,
    });
    repository.update.mockResolvedValue(task);

    await service.update(ownerContext, project.id, task.id, {
      status: 'in_progress',
    });

    expect(repository.update).toHaveBeenCalledWith(
      workspace.id,
      project.id,
      task.id,
      expect.objectContaining({
        status: 'in_progress',
        completedAt: null,
      }),
    );
  });

  it('prevents an ordinary member from deleting tasks', async () => {
    await expect(
      service.delete(memberContext, project.id, task.id),
    ).rejects.toThrow(ForbiddenException);

    expect(repository.findProjectById).not.toHaveBeenCalled();

    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('allows the owner to delete a task', async () => {
    repository.findProjectById.mockResolvedValue(project);
    repository.findById.mockResolvedValue(task);
    repository.delete.mockResolvedValue(task);

    await expect(
      service.delete(ownerContext, project.id, task.id),
    ).resolves.toBeUndefined();

    expect(repository.delete).toHaveBeenCalledWith(
      workspace.id,
      project.id,
      task.id,
    );
  });
});
