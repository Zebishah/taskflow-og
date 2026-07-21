import { IsIn } from 'class-validator';

export const assignableWorkspaceRoles = ['admin', 'member'] as const;

export type AssignableWorkspaceRole = (typeof assignableWorkspaceRoles)[number];

export class UpdateMemberRoleDto {
  @IsIn(assignableWorkspaceRoles)
  public role!: AssignableWorkspaceRole;
}
