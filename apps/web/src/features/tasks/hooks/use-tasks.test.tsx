import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "../../auth/auth-context";
import { updateTask } from "../task-api";
import { taskQueryKeys } from "../task-query-keys";
import type { Task } from "../task.types";
import { useUpdateTaskMutation } from "./use-tasks";

vi.mock("../task-api", () => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  getTask: vi.fn(),
  getTasks: vi.fn(),
  updateTask: vi.fn(),
}));

const workspaceId = "6eea0d06-9ebb-492b-820c-6f08638e5eef";

const projectId = "da135c51-3f2e-4b59-b737-fc92a0e650b5";

const taskId = "15ca922e-d80f-47dd-83e6-d9f5393b398e";
const todoColumnId = "11111111-1111-4111-8111-111111111111";

const doneColumnId = "33333333-3333-4333-8333-333333333333";
const originalTask: Task = {
  id: taskId,
  workspaceId,
  projectId,
  columnId: todoColumnId,
  createdByUserId: "2e01067b-0ae0-431c-8833-d7b2d77518f0",
  assigneeMemberId: null,
  taskNumber: 1,
  title: "Build login page",
  description: null,
  priority: "medium",
  position: 1000,
  dueAt: null,
  completedAt: null,
  imageKey: null,
  imageOriginalName: null,
  imageContentType: null,
  imageSizeBytes: null,
  createdAt: "2026-07-23T10:00:00.000Z",
  updatedAt: "2026-07-23T10:00:00.000Z",
};
const updatedTask: Task = {
  ...originalTask,
  columnId: doneColumnId,
  completedAt: "2026-07-23T12:00:00.000Z",
  updatedAt: "2026-07-23T12:00:00.000Z",
};
const authValue: AuthContextValue = {
  user: {
    id: "2e01067b-0ae0-431c-8833-d7b2d77518f0",
    email: "owner@example.com",
    firstName: "Workspace",
    lastName: "Owner",
    status: "active",
    createdAt: "2026-07-23T10:00:00.000Z",
    updatedAt: "2026-07-23T10:00:00.000Z",
  },

  accessToken: "access-token",
  isAuthenticated: true,
  isInitializing: false,
  completeAuthentication: vi.fn(),
  clearAuthentication: vi.fn(),
};

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({
    children,
  }: PropsWithChildren): React.JSX.Element {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };
}

describe("useUpdateTaskMutation", () => {
  beforeEach(() => {
    vi.mocked(updateTask).mockReset();
  });

  it("updates the detail and list caches after success", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },

        mutations: {
          retry: false,
        },
      },
    });

    const listKey = taskQueryKeys.list(workspaceId, projectId, {});

    const detailKey = taskQueryKeys.detail(workspaceId, projectId, taskId);

    queryClient.setQueryData<Task[]>(listKey, [originalTask]);

    queryClient.setQueryData<Task>(detailKey, originalTask);

    vi.mocked(updateTask).mockResolvedValue(updatedTask);

    const { result } = renderHook(() => useUpdateTaskMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        workspaceId,
        projectId,
        taskId,

        input: {
          columnId: doneColumnId,
        },
      });
    });

    expect(updateTask).toHaveBeenCalledWith(
      workspaceId,
      projectId,
      taskId,
      {
        columnId: doneColumnId,
      },
      "access-token",
    );

    await waitFor(() => {
      expect(queryClient.getQueryData<Task>(detailKey)).toEqual(updatedTask);
    });

    expect(queryClient.getQueryData<Task[]>(listKey)).toEqual([updatedTask]);

    queryClient.clear();
  });

  it("exposes the API error to the component", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    });

    const requestError = new Error("Task update failed");

    vi.mocked(updateTask).mockRejectedValue(requestError);

    const { result } = renderHook(() => useUpdateTaskMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          workspaceId,
          projectId,
          taskId,

          input: {
            columnId: doneColumnId,
          },
        }),
      ).rejects.toBe(requestError);
    });

    await waitFor(() => {
      expect(result.current.error).toBe(requestError);
    });

    queryClient.clear();
  });
});
