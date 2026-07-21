import {
  useMemo,
  useState,
} from 'react';
import {
  Link,
  useParams,
} from 'react-router-dom';

import { useAuth } from '../../auth/use-auth';
import {
  WorkspacePageHeader,
} from '../../workspaces/components/workspace-page-header';
import {
  useWorkspaceQuery,
} from '../../workspaces/hooks/use-workspaces';
import {
  getWorkspaceErrorMessage,
} from '../../workspaces/workspace-api';
import {
  ConfirmationDialog,
} from '../../../shared/components/confirmation-dialog';

import {
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
  useWorkspaceMembersQuery,
} from '../hooks/use-workspace-collaboration';

import type {
  AssignableWorkspaceRole,
  WorkspaceMember,
} from '../workspace-collaboration.types';

type PendingAction =
  | {
      type: 'remove';
      member: WorkspaceMember;
    }
  | {
      type: 'role';
      member: WorkspaceMember;
      role: AssignableWorkspaceRole;
    }
  | null;

function initials(
  member: WorkspaceMember,
): string {
  return `${member.user.firstName[0] ?? ''}${member.user.lastName[0] ?? ''}`
    .toUpperCase();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: 'medium',
    },
  ).format(new Date(value));
}

export function WorkspaceMembersPage(): React.JSX.Element {
  const { workspaceId } =
    useParams<{ workspaceId: string }>();

  const { user } = useAuth();

  const workspaceQuery =
    useWorkspaceQuery(workspaceId);

  const membersQuery =
    useWorkspaceMembersQuery(workspaceId);

  const updateRoleMutation =
    useUpdateMemberRoleMutation();

  const removeMemberMutation =
    useRemoveMemberMutation();

  const [search, setSearch] =
    useState('');

  const [pendingAction, setPendingAction] =
    useState<PendingAction>(null);

  const members = membersQuery.data ?? [];

  const filteredMembers = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return members;
    }

    return members.filter((member) => {
      const fullName =
        `${member.user.firstName} ${member.user.lastName}`
          .toLowerCase();

      return (
        fullName.includes(normalizedSearch) ||
        member.user.email
          .toLowerCase()
          .includes(normalizedSearch) ||
        member.role.includes(normalizedSearch)
      );
    });
  }, [members, search]);

  if (
    workspaceQuery.isLoading ||
    membersQuery.isLoading
  ) {
    return (
      <div className="animate-pulse">
        <div className="h-9 w-64 rounded-xl bg-slate-200" />
        <div className="mt-8 h-20 rounded-[24px] bg-white" />
        <div className="mt-5 h-96 rounded-[28px] bg-white" />
      </div>
    );
  }

  if (
    !workspaceId ||
    workspaceQuery.isError ||
    !workspaceQuery.data ||
    membersQuery.isError
  ) {
    return (
      <section className="rounded-[28px] border border-rose-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-950">
          Members unavailable
        </h1>

        <p className="mt-3 text-sm text-rose-700">
          {getWorkspaceErrorMessage(
            workspaceQuery.error ??
              membersQuery.error,
          )}
        </p>

        <Link
          to="/workspaces"
          className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Return to workspaces
        </Link>
      </section>
    );
  }

  const workspace = workspaceQuery.data;
  const canChangeRoles =
    workspace.role === 'owner';

  const canManageInvitations =
    workspace.role === 'owner' ||
    workspace.role === 'admin';

  function canRemoveMember(
    member: WorkspaceMember,
  ): boolean {
    if (
      member.role === 'owner' ||
      member.userId === user?.id
    ) {
      return false;
    }

    if (workspace.role === 'owner') {
      return true;
    }

    return (
      workspace.role === 'admin' &&
      member.role === 'member'
    );
  }

  async function confirmAction(): Promise<void> {
    if (!pendingAction) {
      return;
    }

    if (!workspaceId) {
      return;
    }

    try {
      if (pendingAction.type === 'remove') {
        await removeMemberMutation.mutateAsync({
          workspaceId,
          memberId: pendingAction.member.id,
        });
      } else {
        await updateRoleMutation.mutateAsync({
          workspaceId,
          memberId: pendingAction.member.id,
          input: {
            role: pendingAction.role,
          },
        });
      }

      setPendingAction(null);
    } catch {
      // The mutation error is displayed below.
    }
  }

  const actionError =
    updateRoleMutation.error ??
    removeMemberMutation.error;

  const isActionPending =
    updateRoleMutation.isPending ||
    removeMemberMutation.isPending;

  return (
    <section>
      <WorkspacePageHeader
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        title="Workspace members"
        description="Review everyone with access and manage their workspace permissions."
      />

      <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {members.length}{' '}
            {members.length === 1
              ? 'member'
              : 'members'}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Owners control roles. Admins may
            remove ordinary members.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            aria-label="Search workspace members"
            placeholder="Search members..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 sm:w-64"
          />

          {canManageInvitations && (
            <Link
              to={`/workspaces/${workspace.id}/invitations`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/15 transition hover:-translate-y-0.5 hover:bg-violet-700"
            >
              <span aria-hidden="true">+</span>
              Invite member
            </Link>
          )}
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {getWorkspaceErrorMessage(
            actionError,
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="font-semibold text-slate-900">
              No members found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Try a different search term.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredMembers.map((member) => {
              const isCurrentUser =
                member.userId === user?.id;

              return (
                <li
                  key={member.id}
                  className="flex flex-col gap-5 p-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-emerald-100 text-sm font-bold text-violet-700">
                      {initials(member)}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-950">
                          {member.user.firstName}{' '}
                          {member.user.lastName}
                        </p>

                        {isCurrentUser && (
                          <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-600">
                            You
                          </span>
                        )}

                        <span
                          className={[
                            'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                            member.role === 'owner'
                              ? 'bg-amber-50 text-amber-700'
                              : member.role === 'admin'
                                ? 'bg-violet-50 text-violet-700'
                                : 'bg-slate-100 text-slate-600',
                          ].join(' ')}
                        >
                          {member.role}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {member.user.email}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Joined{' '}
                        {formatDate(member.joinedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {canChangeRoles &&
                      member.role !== 'owner' &&
                      !isCurrentUser && (
                        <select
                          aria-label={`Role for ${member.user.firstName}`}
                          value={member.role}
                          disabled={isActionPending}
                          onChange={(event) => {
                            const role =
                              event.target.value as AssignableWorkspaceRole;

                            if (
                              role !== member.role
                            ) {
                              setPendingAction({
                                type: 'role',
                                member,
                                role,
                              });
                            }
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        >
                          <option value="member">
                            Member
                          </option>
                          <option value="admin">
                            Admin
                          </option>
                        </select>
                      )}

                    {canRemoveMember(member) && (
                      <button
                        type="button"
                        disabled={isActionPending}
                        onClick={() =>
                          setPendingAction({
                            type: 'remove',
                            member,
                          })
                        }
                        className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmationDialog
        isOpen={pendingAction !== null}
        title={
          pendingAction?.type === 'remove'
            ? 'Remove workspace member?'
            : 'Change member role?'
        }
        description={
          pendingAction?.type === 'remove'
            ? `${pendingAction.member.user.firstName} ${pendingAction.member.user.lastName} will immediately lose access to this workspace.`
            : `${pendingAction?.member.user.firstName} will become ${pendingAction?.role}. Their permissions will change immediately.`
        }
        confirmLabel={
          pendingAction?.type === 'remove'
            ? 'Remove member'
            : 'Change role'
        }
        tone={
          pendingAction?.type === 'remove'
            ? 'danger'
            : 'primary'
        }
        isPending={isActionPending}
        onConfirm={() =>
          void confirmAction()
        }
        onClose={() => {
          if (!isActionPending) {
            setPendingAction(null);
          }
        }}
      />
    </section>
  );
}