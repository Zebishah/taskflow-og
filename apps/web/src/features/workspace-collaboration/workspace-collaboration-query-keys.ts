export const collaborationQueryKeys = {
  all: ["workspace-collaboration"] as const,

  members: (workspaceId: string) =>
    [...collaborationQueryKeys.all, "members", workspaceId] as const,

  invitations: (workspaceId: string) =>
    [...collaborationQueryKeys.all, "invitations", workspaceId] as const,

  invitationPreview: (token: string) =>
    [...collaborationQueryKeys.all, "invitation-preview", token] as const,
};
