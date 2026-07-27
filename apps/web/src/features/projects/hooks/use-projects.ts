import { skipToken } from "@reduxjs/toolkit/query/react";

import { useAuth } from "../../auth/use-auth";
import {
  useArchiveProjectRtkMutation,
  useCreateProjectRtkMutation,
  useGetProjectQuery,
  useGetProjectsQuery,
  useRestoreProjectRtkMutation,
  useUpdateProjectRtkMutation,
} from "../project-rtk-api";
import type { CreateProjectInput, UpdateProjectInput } from "../project.types";

function requireAccessToken(accessToken: string | null): string {
  if (!accessToken) {
    throw new Error("Authentication is required");
  }

  return accessToken;
}

export function useProjectsQuery(workspaceId: string | undefined) {
  const { accessToken } = useAuth();

  return useGetProjectsQuery(
    workspaceId && accessToken
      ? {
          workspaceId,
          accessToken,
        }
      : skipToken,
    {
      /*
       * Cached data is returned immediately.
       * Data older than 60 seconds is refreshed.
       */
      refetchOnMountOrArgChange: 60,
    },
  );
}

export function useProjectQuery(
  workspaceId: string | undefined,
  projectId: string | undefined,
) {
  const { accessToken } = useAuth();

  return useGetProjectQuery(
    workspaceId && projectId && accessToken
      ? {
          workspaceId,
          projectId,
          accessToken,
        }
      : skipToken,
    {
      refetchOnMountOrArgChange: 60,
    },
  );
}

interface CreateProjectVariables {
  workspaceId: string;
  input: CreateProjectInput;
}

export function useCreateProjectMutation() {
  const { accessToken } = useAuth();

  const [trigger, mutation] = useCreateProjectRtkMutation();

  return {
    ...mutation,
    isPending: mutation.isLoading,

    mutateAsync: ({ workspaceId, input }: CreateProjectVariables) =>
      trigger({
        workspaceId,
        input,
        accessToken: requireAccessToken(accessToken),
      }).unwrap(),
  };
}

interface UpdateProjectVariables {
  workspaceId: string;
  projectId: string;
  input: UpdateProjectInput;
}

export function useUpdateProjectMutation() {
  const { accessToken } = useAuth();

  const [trigger, mutation] = useUpdateProjectRtkMutation();

  return {
    ...mutation,
    isPending: mutation.isLoading,

    mutateAsync: ({ workspaceId, projectId, input }: UpdateProjectVariables) =>
      trigger({
        workspaceId,
        projectId,
        input,
        accessToken: requireAccessToken(accessToken),
      }).unwrap(),
  };
}

interface ProjectActionVariables {
  workspaceId: string;
  projectId: string;
}

export function useArchiveProjectMutation() {
  const { accessToken } = useAuth();

  const [trigger, mutation] = useArchiveProjectRtkMutation();

  return {
    ...mutation,
    isPending: mutation.isLoading,

    mutateAsync: ({ workspaceId, projectId }: ProjectActionVariables) =>
      trigger({
        workspaceId,
        projectId,
        accessToken: requireAccessToken(accessToken),
      }).unwrap(),
  };
}

export function useRestoreProjectMutation() {
  const { accessToken } = useAuth();

  const [trigger, mutation] = useRestoreProjectRtkMutation();

  return {
    ...mutation,
    isPending: mutation.isLoading,

    mutateAsync: ({ workspaceId, projectId }: ProjectActionVariables) =>
      trigger({
        workspaceId,
        projectId,
        accessToken: requireAccessToken(accessToken),
      }).unwrap(),
  };
}
