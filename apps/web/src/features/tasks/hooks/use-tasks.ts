import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";

import { useAuth } from "../../auth/use-auth";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
} from "../task-api";
import { taskQueryKeys } from "../task-query-keys";
import type {
  CreateTaskInput,
  Task,
  TaskFilters,
  UpdateTaskInput,
} from "../task.types";

function requireAccessToken(accessToken: string | null): string {
  if (!accessToken) {
    throw new Error("Authentication is required");
  }

  return accessToken;
}

export function useTasksQuery(
  workspaceId: string | undefined,
  projectId: string | undefined,
  filters: TaskFilters,
) {
  const { accessToken } = useAuth();

  return useQuery<Task[]>({
    queryKey: taskQueryKeys.list(workspaceId ?? "", projectId ?? "", filters),

    queryFn: () => {
      if (!workspaceId || !projectId) {
        throw new Error("Workspace and project identifiers are required");
      }

      return getTasks(
        workspaceId,
        projectId,
        filters,
        requireAccessToken(accessToken),
      );
    },

    enabled: Boolean(workspaceId) && Boolean(projectId) && accessToken !== null,

    staleTime: 15_000,
  });
}

export function useTaskQuery(
  workspaceId: string | undefined,
  projectId: string | undefined,
  taskId: string | undefined,
) {
  const { accessToken } = useAuth();

  return useQuery<Task>({
    queryKey: taskQueryKeys.detail(
      workspaceId ?? "",
      projectId ?? "",
      taskId ?? "",
    ),

    queryFn: () => {
      if (!workspaceId || !projectId || !taskId) {
        throw new Error("Workspace, project and task identifiers are required");
      }

      return getTask(
        workspaceId,
        projectId,
        taskId,
        requireAccessToken(accessToken),
      );
    },

    enabled:
      Boolean(workspaceId) &&
      Boolean(projectId) &&
      Boolean(taskId) &&
      accessToken !== null,

    staleTime: 15_000,
  });
}

interface CreateTaskVariables {
  workspaceId: string;
  projectId: string;
  input: CreateTaskInput;
}

export function useCreateTaskMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, projectId, input }: CreateTaskVariables) =>
      createTask(
        workspaceId,
        projectId,
        input,
        requireAccessToken(accessToken),
      ),

    onSuccess: (task) => {
      queryClient.setQueryData(
        taskQueryKeys.detail(task.workspaceId, task.projectId, task.id),
        task,
      );

      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.lists(task.workspaceId, task.projectId),
      });
    },
  });
}

interface UpdateTaskVariables {
  workspaceId: string;
  projectId: string;
  taskId: string;
  input: UpdateTaskInput;
}

export function useUpdateTaskMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      projectId,
      taskId,
      input,
    }: UpdateTaskVariables) =>
      updateTask(
        workspaceId,
        projectId,
        taskId,
        input,
        requireAccessToken(accessToken),
      ),

    onSuccess: (task) => {
      queryClient.setQueryData(
        taskQueryKeys.detail(task.workspaceId, task.projectId, task.id),
        task,
      );

      queryClient.setQueriesData<Task[]>(
        {
          queryKey: taskQueryKeys.lists(task.workspaceId, task.projectId),
        },
        (currentTasks) =>
          currentTasks?.map((currentTask) =>
            currentTask.id === task.id ? task : currentTask,
          ),
      );

      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.lists(task.workspaceId, task.projectId),
      });
    },
  });
}

interface DeleteTaskVariables {
  workspaceId: string;
  projectId: string;
  taskId: string;
}

export function useDeleteTaskMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, projectId, taskId }: DeleteTaskVariables) =>
      deleteTask(
        workspaceId,
        projectId,
        taskId,
        requireAccessToken(accessToken),
      ),

    onSuccess: (_result, variables) => {
      queryClient.removeQueries({
        queryKey: taskQueryKeys.detail(
          variables.workspaceId,
          variables.projectId,
          variables.taskId,
        ),
      });

      queryClient.setQueriesData<Task[]>(
        {
          queryKey: taskQueryKeys.lists(
            variables.workspaceId,
            variables.projectId,
          ),
        },
        (currentTasks) =>
          currentTasks?.filter((task) => task.id !== variables.taskId),
      );

      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.lists(
          variables.workspaceId,
          variables.projectId,
        ),
      });
    },
  });
}
interface MoveTaskVariables {
  workspaceId: string;
  projectId: string;
  task: Task;
  status: Task["status"];
}

interface MoveTaskContext {
  snapshots: Array<readonly [QueryKey, Task[] | undefined]>;
}

export function useMoveTaskMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Task, Error, MoveTaskVariables, MoveTaskContext>({
    mutationFn: ({ workspaceId, projectId, task, status }) =>
      updateTask(
        workspaceId,
        projectId,
        task.id,
        {
          status,
        },
        requireAccessToken(accessToken),
      ),

    onMutate: async (variables) => {
      const listKey = taskQueryKeys.lists(
        variables.workspaceId,
        variables.projectId,
      );

      await queryClient.cancelQueries({
        queryKey: listKey,
      });

      const snapshots = queryClient.getQueriesData<Task[]>({
        queryKey: listKey,
      });

      queryClient.setQueriesData<Task[]>(
        {
          queryKey: listKey,
        },
        (currentTasks) =>
          currentTasks?.map((task) =>
            task.id === variables.task.id
              ? {
                  ...task,
                  status: variables.status,
                }
              : task,
          ),
      );

      return {
        snapshots,
      };
    },

    onError: (_error, _variables, context) => {
      for (const [queryKey, tasks] of context?.snapshots ?? []) {
        queryClient.setQueryData(queryKey, tasks);
      }
    },

    onSuccess: (task) => {
      queryClient.setQueryData(
        taskQueryKeys.detail(task.workspaceId, task.projectId, task.id),
        task,
      );

      queryClient.setQueriesData<Task[]>(
        {
          queryKey: taskQueryKeys.lists(task.workspaceId, task.projectId),
        },
        (currentTasks) =>
          currentTasks?.map((currentTask) =>
            currentTask.id === task.id ? task : currentTask,
          ),
      );
    },

    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.lists(
          variables.workspaceId,
          variables.projectId,
        ),
      });
    },
  });
}
