import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth/use-auth";
import {
  archiveProject,
  createProject,
  getProject,
  getProjects,
  restoreProject,
  updateProject,
} from "../project-api";
import { projectQueryKeys } from "../project-query-keys";
import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "../project.types";

function requireAccessToken(accessToken: string | null): string {
  if (!accessToken) {
    throw new Error("Authentication is required");
  }

  return accessToken;
}

export function useProjectsQuery(workspaceId: string | undefined) {
  const { accessToken } = useAuth();

  return useQuery<Project[]>({
    queryKey: projectQueryKeys.list(workspaceId ?? ""),

    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace identifier is required");
      }

      return getProjects(workspaceId, requireAccessToken(accessToken));
    },

    enabled: Boolean(workspaceId) && accessToken !== null,

    staleTime: 30_000,
  });
}

export function useProjectQuery(
  workspaceId: string | undefined,
  projectId: string | undefined,
) {
  const { accessToken } = useAuth();

  return useQuery<Project>({
    queryKey: projectQueryKeys.detail(workspaceId ?? "", projectId ?? ""),

    queryFn: () => {
      if (!workspaceId || !projectId) {
        throw new Error("Workspace and project identifiers are required");
      }

      return getProject(
        workspaceId,
        projectId,
        requireAccessToken(accessToken),
      );
    },

    enabled: Boolean(workspaceId) && Boolean(projectId) && accessToken !== null,

    staleTime: 30_000,
  });
}

interface CreateProjectVariables {
  workspaceId: string;
  input: CreateProjectInput;
}

export function useCreateProjectMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, input }: CreateProjectVariables) =>
      createProject(workspaceId, input, requireAccessToken(accessToken)),

    onSuccess: (project) => {
      queryClient.setQueryData<Project[]>(
        projectQueryKeys.list(project.workspaceId),
        (projects) => {
          if (!projects) {
            return [project];
          }

          return [
            project,
            ...projects.filter((item) => item.id !== project.id),
          ].sort((first, second) => first.name.localeCompare(second.name));
        },
      );

      queryClient.setQueryData(
        projectQueryKeys.detail(project.workspaceId, project.id),
        project,
      );

      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.list(project.workspaceId),
      });
    },
  });
}

interface UpdateProjectVariables {
  workspaceId: string;
  projectId: string;
  input: UpdateProjectInput;
}

export function useUpdateProjectMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, projectId, input }: UpdateProjectVariables) =>
      updateProject(
        workspaceId,
        projectId,
        input,
        requireAccessToken(accessToken),
      ),

    onSuccess: (project) => {
      queryClient.setQueryData<Project[]>(
        projectQueryKeys.list(project.workspaceId),
        (projects) =>
          projects
            ?.map((item) => (item.id === project.id ? project : item))
            .sort((first, second) => first.name.localeCompare(second.name)),
      );

      queryClient.setQueryData(
        projectQueryKeys.detail(project.workspaceId, project.id),
        project,
      );
    },
  });
}

interface ProjectActionVariables {
  workspaceId: string;
  projectId: string;
}

export function useArchiveProjectMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, projectId }: ProjectActionVariables) =>
      archiveProject(workspaceId, projectId, requireAccessToken(accessToken)),

    onSuccess: (_result, variables) => {
      /*
       * DELETE returns 204, so invalidate and
       * reload the server-generated archive time.
       */
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.list(variables.workspaceId),
      });

      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.detail(
          variables.workspaceId,
          variables.projectId,
        ),
      });
    },
  });
}

export function useRestoreProjectMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, projectId }: ProjectActionVariables) =>
      restoreProject(workspaceId, projectId, requireAccessToken(accessToken)),

    onSuccess: (project) => {
      queryClient.setQueryData<Project[]>(
        projectQueryKeys.list(project.workspaceId),
        (projects) =>
          projects?.map((item) => (item.id === project.id ? project : item)),
      );

      queryClient.setQueryData(
        projectQueryKeys.detail(project.workspaceId, project.id),
        project,
      );

      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.list(project.workspaceId),
      });
    },
  });
}
