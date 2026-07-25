import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { taskQueryKeys } from "../../tasks/task-query-keys";
import {
  createProjectColumn,
  deleteProjectColumn,
  getProjectColumns,
  reorderProjectColumns,
  updateProjectColumn,
} from "../project-column-api";
import { projectColumnQueryKeys } from "../project-column-query-keys";
import type {
  CreateProjectColumnInput,
  UpdateProjectColumnInput,
} from "../project-column.types";
import { useAuth } from "../../auth/use-auth";

function requireToken(accessToken: string | null): string {
  if (!accessToken) {
    throw new Error("Authentication is required");
  }

  return accessToken;
}

export function useProjectColumnsQuery(
  workspaceId?: string,
  projectId?: string,
) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: projectColumnQueryKeys.list(workspaceId ?? "", projectId ?? ""),

    queryFn: () =>
      getProjectColumns(workspaceId!, projectId!, requireToken(accessToken)),

    enabled: Boolean(workspaceId) && Boolean(projectId) && Boolean(accessToken),
  });
}

interface ColumnVariables {
  workspaceId: string;
  projectId: string;
}

export function useCreateProjectColumnMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      variables: ColumnVariables & {
        input: CreateProjectColumnInput;
      },
    ) =>
      createProjectColumn(
        variables.workspaceId,
        variables.projectId,
        variables.input,
        requireToken(accessToken),
      ),

    onSuccess: (_column, variables) => {
      void queryClient.invalidateQueries({
        queryKey: projectColumnQueryKeys.list(
          variables.workspaceId,
          variables.projectId,
        ),
      });
    },
  });
}

export function useUpdateProjectColumnMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      variables: ColumnVariables & {
        columnId: string;
        input: UpdateProjectColumnInput;
      },
    ) =>
      updateProjectColumn(
        variables.workspaceId,
        variables.projectId,
        variables.columnId,
        variables.input,
        requireToken(accessToken),
      ),

    onSuccess: (_column, variables) => {
      void queryClient.invalidateQueries({
        queryKey: projectColumnQueryKeys.list(
          variables.workspaceId,
          variables.projectId,
        ),
      });
    },
  });
}

export function useReorderProjectColumnsMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      variables: ColumnVariables & {
        columnIds: string[];
      },
    ) =>
      reorderProjectColumns(
        variables.workspaceId,
        variables.projectId,
        variables.columnIds,
        requireToken(accessToken),
      ),

    onSuccess: (columns, variables) => {
      queryClient.setQueryData(
        projectColumnQueryKeys.list(variables.workspaceId, variables.projectId),
        columns,
      );
    },
  });
}

export function useDeleteProjectColumnMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      variables: ColumnVariables & {
        columnId: string;
        moveTasksToColumnId?: string;
      },
    ) =>
      deleteProjectColumn(
        variables.workspaceId,
        variables.projectId,
        variables.columnId,
        variables.moveTasksToColumnId,
        requireToken(accessToken),
      ),

    onSuccess: (_result, variables) => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: projectColumnQueryKeys.list(
            variables.workspaceId,
            variables.projectId,
          ),
        }),

        queryClient.invalidateQueries({
          queryKey: taskQueryKeys.lists(
            variables.workspaceId,
            variables.projectId,
          ),
        }),
      ]);
    },
  });
}
