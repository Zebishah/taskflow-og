import { IsEmail, IsIn, MaxLength } from 'class-validator';

export const invitationWorkspaceRoles = ['admin', 'member'] as const;

export type InvitationWorkspaceRole = (typeof invitationWorkspaceRoles)[number];

export class CreateWorkspaceInvitationDto {
  @IsEmail()
  @MaxLength(320)
  public email!: string;

  @IsIn(invitationWorkspaceRoles)
  public role!: InvitationWorkspaceRole;
}
