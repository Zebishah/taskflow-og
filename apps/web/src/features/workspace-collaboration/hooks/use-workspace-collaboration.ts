import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth/use-auth";
import { workspaceQueryKeys } from "../../workspaces/workspace-query-keys";

import {
  acceptWorkspaceInvitation,
  cancelWorkspaceInvitation,
  createWorkspaceInvitation,
  declineWorkspaceInvitation,
  getInvitationPreview,
  getWorkspaceInvitations,
  getWorkspaceMembers,
  removeWorkspaceMember,
  resendWorkspaceInvitation,
  updateWorkspaceMemberRole,
} from "../workspace-collaboration-api";

import { collaborationQueryKeys } from "../workspace-collaboration-query-keys";

import type {
  CreateInvitationInput,
  UpdateMemberRoleInput,
  WorkspaceInvitation,
  WorkspaceMember,
} from "../workspace-collaboration.types";

function requireAccessToken(accessToken: string | null): string {
  if (!accessToken) {
    throw new Error("Authentication is required");
  }

  return accessToken;
}

export function useWorkspaceMembersQuery(workspaceId: string | undefined) {
  const { accessToken } = useAuth();

  return useQuery<WorkspaceMember[]>({
    queryKey: collaborationQueryKeys.members(workspaceId ?? ""),

    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace identifier is required");
      }

      return getWorkspaceMembers(workspaceId, requireAccessToken(accessToken));
    },

    enabled: Boolean(workspaceId) && accessToken !== null,

    staleTime: 30_000,
  });
}

export function useWorkspaceInvitationsQuery(
  workspaceId: string | undefined,
  enabled: boolean,
) {
  const { accessToken } = useAuth();

  return useQuery<WorkspaceInvitation[]>({
    queryKey: collaborationQueryKeys.invitations(workspaceId ?? ""),

    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace identifier is required");
      }

      return getWorkspaceInvitations(
        workspaceId,
        requireAccessToken(accessToken),
      );
    },

    enabled: enabled && Boolean(workspaceId) && accessToken !== null,

    staleTime: 15_000,
  });
}

export function useInvitationPreviewQuery(token: string | undefined) {
  return useQuery({
    queryKey: collaborationQueryKeys.invitationPreview(token ?? ""),

    queryFn: () => {
      if (!token) {
        throw new Error("Invitation token is required");
      }

      return getInvitationPreview(token);
    },

    enabled: Boolean(token),

    retry: (failureCount, error) => {
      if (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error
      ) {
        const statusCode = error.statusCode;

        if (statusCode === 404 || statusCode === 410) {
          return false;
        }
      }

      return failureCount < 2;
    },
  });
}

interface UpdateRoleVariables {
  workspaceId: string;
  memberId: string;
  input: UpdateMemberRoleInput;
}

export function useUpdateMemberRoleMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, memberId, input }: UpdateRoleVariables) =>
      updateWorkspaceMemberRole(
        workspaceId,
        memberId,
        input,
        requireAccessToken(accessToken),
      ),

    onSuccess: (updatedMember, variables) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        collaborationQueryKeys.members(variables.workspaceId),
        (members) =>
          members?.map((member) =>
            member.id === updatedMember.id
              ? {
                  ...member,
                  role: updatedMember.role,
                  updatedAt: updatedMember.updatedAt,
                }
              : member,
          ),
      );

      void queryClient.invalidateQueries({
        queryKey: collaborationQueryKeys.members(variables.workspaceId),
      });
    },
  });
}

interface RemoveMemberVariables {
  workspaceId: string;
  memberId: string;
}

export function useRemoveMemberMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, memberId }: RemoveMemberVariables) =>
      removeWorkspaceMember(
        workspaceId,
        memberId,
        requireAccessToken(accessToken),
      ),

    onSuccess: (_result, variables) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        collaborationQueryKeys.members(variables.workspaceId),
        (members) =>
          members?.filter((member) => member.id !== variables.memberId),
      );

      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.detail(variables.workspaceId),
      });
    },
  });
}

interface CreateInvitationVariables {
  workspaceId: string;
  input: CreateInvitationInput;
}

export function useCreateInvitationMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, input }: CreateInvitationVariables) =>
      createWorkspaceInvitation(
        workspaceId,
        input,
        requireAccessToken(accessToken),
      ),

    onSuccess: (invitation, variables) => {
      queryClient.setQueryData<WorkspaceInvitation[]>(
        collaborationQueryKeys.invitations(variables.workspaceId),
        (invitations) => {
          if (!invitations) {
            return [invitation];
          }

          return [
            invitation,
            ...invitations.filter((item) => item.id !== invitation.id),
          ];
        },
      );

      void queryClient.invalidateQueries({
        queryKey: collaborationQueryKeys.invitations(variables.workspaceId),
      });
    },
  });
}

interface InvitationMutationVariables {
  workspaceId: string;
  invitationId: string;
}

export function useResendInvitationMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, invitationId }: InvitationMutationVariables) =>
      resendWorkspaceInvitation(
        workspaceId,
        invitationId,
        requireAccessToken(accessToken),
      ),

    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: collaborationQueryKeys.invitations(variables.workspaceId),
      });
    },
  });
}

export function useCancelInvitationMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, invitationId }: InvitationMutationVariables) =>
      cancelWorkspaceInvitation(
        workspaceId,
        invitationId,
        requireAccessToken(accessToken),
      ),

    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: collaborationQueryKeys.invitations(variables.workspaceId),
      });
    },
  });
}

export function useAcceptInvitationMutation(token: string) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      acceptWorkspaceInvitation(token, requireAccessToken(accessToken)),

    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.list(),
      });

      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.detail(result.workspaceId),
      });

      void queryClient.invalidateQueries({
        queryKey: collaborationQueryKeys.members(result.workspaceId),
      });

      void queryClient.invalidateQueries({
        queryKey: collaborationQueryKeys.invitationPreview(token),
      });
    },
  });
}

export function useDeclineInvitationMutation(token: string) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      declineWorkspaceInvitation(token, requireAccessToken(accessToken)),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: collaborationQueryKeys.invitationPreview(token),
      });
    },
  });
}
