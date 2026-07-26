import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth/use-auth";
import {
  confirmTaskImageUpload,
  createTaskImageUploadIntent,
  deleteTaskImage,
  getTaskImage,
  uploadTaskImageToS3,
} from "../task-image-api";
import type { TaskImage } from "../task-image.types";
import { taskQueryKeys } from "../task-query-keys";

function requireAccessToken(accessToken: string | null): string {
  if (!accessToken) {
    throw new Error("Authentication is required");
  }

  return accessToken;
}

export const taskImageQueryKeys = {
  detail: (workspaceId: string, projectId: string, taskId: string) =>
    ["task-image", workspaceId, projectId, taskId] as const,
};

interface UploadTaskImageVariables {
  workspaceId: string;
  projectId: string;
  taskId: string;
  file: File;
}

export function useTaskImageQuery(
  workspaceId: string,
  projectId: string,
  taskId: string,
  hasImage: boolean,
) {
  const { accessToken } = useAuth();

  return useQuery<TaskImage>({
    queryKey: taskImageQueryKeys.detail(workspaceId, projectId, taskId),

    queryFn: () =>
      getTaskImage(
        workspaceId,
        projectId,
        taskId,
        requireAccessToken(accessToken),
      ),

    enabled: hasImage && accessToken !== null,
    staleTime: 4 * 60 * 1_000,
    gcTime: 10 * 60 * 1_000,
  });
}

export function useUploadTaskImageMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<TaskImage, Error, UploadTaskImageVariables>({
    mutationFn: async ({ workspaceId, projectId, taskId, file }) => {
      const token = requireAccessToken(accessToken);

      const intent = await createTaskImageUploadIntent(
        workspaceId,
        projectId,
        taskId,
        file,
        token,
      );

      await uploadTaskImageToS3(intent, file);

      return confirmTaskImageUpload(
        workspaceId,
        projectId,
        taskId,
        intent.objectKey,
        token,
      );
    },

    onSuccess: (image, variables) => {
      queryClient.setQueryData(
        taskImageQueryKeys.detail(
          variables.workspaceId,
          variables.projectId,
          variables.taskId,
        ),
        image,
      );

      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.lists(
          variables.workspaceId,
          variables.projectId,
        ),
      });

      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.detail(
          variables.workspaceId,
          variables.projectId,
          variables.taskId,
        ),
      });
    },
  });
}

interface DeleteTaskImageVariables {
  workspaceId: string;
  projectId: string;
  taskId: string;
}

export function useDeleteTaskImageMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteTaskImageVariables>({
    mutationFn: ({ workspaceId, projectId, taskId }) =>
      deleteTaskImage(
        workspaceId,
        projectId,
        taskId,
        requireAccessToken(accessToken),
      ),

    onSuccess: (_result, variables) => {
      queryClient.removeQueries({
        queryKey: taskImageQueryKeys.detail(
          variables.workspaceId,
          variables.projectId,
          variables.taskId,
        ),
      });

      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.lists(
          variables.workspaceId,
          variables.projectId,
        ),
      });

      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.detail(
          variables.workspaceId,
          variables.projectId,
          variables.taskId,
        ),
      });
    },
  });
}
