import {
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  Navigate,
  useParams,
} from 'react-router-dom';

import {
  ConfirmationDialog,
} from '../../../shared/components/confirmation-dialog';
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
  useCancelInvitationMutation,
  useCreateInvitationMutation,
  useResendInvitationMutation,
  useWorkspaceInvitationsQuery,
} from '../hooks/use-workspace-collaboration';

import type {
  AssignableWorkspaceRole,
  WorkspaceInvitation,
} from '../workspace-collaboration.types';

type InvitationAction =
  | {
      type: 'cancel';
      invitation: WorkspaceInvitation;
    }
  | {
      type: 'resend';
      invitation: WorkspaceInvitation;
    }
  | null;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(new Date(value));
}

function isExpired(
  invitation: WorkspaceInvitation,
): boolean {
  return (
    invitation.status === 'pending' &&
    new Date(invitation.expiresAt).getTime() <=
      Date.now()
  );
}

export function WorkspaceInvitationsPage(): React.JSX.Element {
  const { workspaceId } =
    useParams<{ workspaceId: string }>();

  const workspaceQuery =
    useWorkspaceQuery(workspaceId);

  const canManage =
    workspaceQuery.data?.role === 'owner' ||
    workspaceQuery.data?.role === 'admin';

  const invitationsQuery =
    useWorkspaceInvitationsQuery(
      workspaceId,
      canManage,
    );

  const createMutation =
    useCreateInvitationMutation();

  const resendMutation =
    useResendInvitationMutation();

  const cancelMutation =
    useCancelInvitationMutation();

  const [email, setEmail] =
    useState('');

  const [role, setRole] =
    useState<AssignableWorkspaceRole>(
      'member',
    );

  const [createdEmail, setCreatedEmail] =
    useState<string | null>(null);

  const [action, setAction] =
    useState<InvitationAction>(null);

  const invitations =
    invitationsQuery.data ?? [];

  const pendingInvitations = useMemo(
    () =>
      invitations.filter(
        (invitation) =>
          invitation.status === 'pending',
      ),
    [invitations],
  );

  if (workspaceQuery.isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-9 w-72 rounded bg-slate-200" />
        <div className="mt-8 h-72 rounded-[28px] bg-white" />
        <div className="mt-6 h-96 rounded-[28px] bg-white" />
      </div>
    );
  }

  if (
    !workspaceId ||
    workspaceQuery.isError ||
    !workspaceQuery.data
  ) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-white p-8 text-center text-sm text-rose-700">
        {getWorkspaceErrorMessage(
          workspaceQuery.error,
        )}
      </div>
    );
  }

  const workspace = workspaceQuery.data;

  if (!canManage) {
    return (
      <Navigate
        to={`/workspaces/${workspace.id}/members`}
        replace
      />
    );
  }

  const canInviteAdmin =
    workspace.role === 'owner';

  async function handleCreate(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      return;
    }

    setCreatedEmail(null);

    try {
      await createMutation.mutateAsync({
        workspaceId: workspace.id,
        input: {
          email: normalizedEmail,
          role:
            canInviteAdmin
              ? role
              : 'member',
        },
      });

      setEmail('');
      setRole('member');
      setCreatedEmail(normalizedEmail);
    } catch {
      // Error is rendered below.
    }
  }

  async function confirmAction(): Promise<void> {
    if (!action) {
      return;
    }

    const variables = {
      workspaceId: workspace.id,
      invitationId:
        action.invitation.id,
    };

    try {
      if (action.type === 'cancel') {
        await cancelMutation.mutateAsync(
          variables,
        );
      } else {
        await resendMutation.mutateAsync(
          variables,
        );
      }

      setAction(null);
    } catch {
      // Error is rendered below.
    }
  }

  const actionError =
    cancelMutation.error ??
    resendMutation.error;

  const isActionPending =
    cancelMutation.isPending ||
    resendMutation.isPending;

  return (
    <section>
      <WorkspacePageHeader
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        title="Workspace invitations"
        description="Invite teammates and manage pending workspace invitations."
      />

      <form
        onSubmit={(event) =>
          void handleCreate(event)
        }
        className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label
              htmlFor="invitation-email"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Email address
            </label>

            <input
              id="invitation-email"
              type="email"
              required
              maxLength={320}
              autoComplete="email"
              placeholder="teammate@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setCreatedEmail(null);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div className="lg:w-52">
            <label
              htmlFor="invitation-role"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Workspace role
            </label>

            <select
              id="invitation-role"
              value={
                canInviteAdmin
                  ? role
                  : 'member'
              }
              disabled={!canInviteAdmin}
              onChange={(event) =>
                setRole(
                  event.target.value as AssignableWorkspaceRole,
                )
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="member">
                Member
              </option>

              {canInviteAdmin && (
                <option value="admin">
                  Admin
                </option>
              )}
            </select>
          </div>

          <button
            type="submit"
            disabled={
              createMutation.isPending ||
              email.trim().length === 0
            }
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/15 transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}

            {createMutation.isPending
              ? 'Sending invitation...'
              : 'Send invitation'}
          </button>
        </div>

        {!canInviteAdmin && (
          <p className="mt-3 text-xs text-slate-500">
            Administrators may invite members.
            Only the owner can invite another
            administrator.
          </p>
        )}

        {createMutation.isError && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {getWorkspaceErrorMessage(
              createMutation.error,
            )}
          </div>
        )}

        {createdEmail && (
          <div
            role="status"
            className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          >
            Invitation sent successfully to{' '}
            {createdEmail}.
          </div>
        )}
      </form>

      <section className="mt-7 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="font-semibold text-slate-950">
              Invitation history
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {pendingInvitations.length}{' '}
              pending invitation
              {pendingInvitations.length === 1
                ? ''
                : 's'}
            </p>
          </div>

          <button
            type="button"
            disabled={
              invitationsQuery.isFetching
            }
            onClick={() =>
              void invitationsQuery.refetch()
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {invitationsQuery.isFetching
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>

        {invitationsQuery.isLoading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : invitationsQuery.isError ? (
          <div className="p-8 text-center text-sm text-rose-700">
            {getWorkspaceErrorMessage(
              invitationsQuery.error,
            )}
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
              ✉
            </span>

            <h3 className="mt-4 font-semibold text-slate-900">
              No invitations yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Invite your first teammate using
              the form above.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {invitations.map((invitation) => {
              const expired =
                isExpired(invitation);

              const visibleStatus = expired
                ? 'expired'
                : invitation.status;

              return (
                <li
                  key={invitation.id}
                  className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-slate-950">
                        {invitation.email}
                      </p>

                      <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                        {invitation.role}
                      </span>

                      <span
                        className={[
                          'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                          visibleStatus ===
                          'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : visibleStatus ===
                                'accepted'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600',
                        ].join(' ')}
                      >
                        {visibleStatus}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Invited by{' '}
                      {invitation.invitedBy
                        .firstName}{' '}
                      {invitation.invitedBy
                        .lastName}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {visibleStatus === 'pending'
                        ? `Expires ${formatDate(invitation.expiresAt)}`
                        : `Updated ${formatDate(invitation.updatedAt)}`}
                    </p>
                  </div>

                  {invitation.status ===
                    'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={
                          isActionPending
                        }
                        onClick={() =>
                          setAction({
                            type: 'resend',
                            invitation,
                          })
                        }
                        className="rounded-xl border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
                      >
                        Resend
                      </button>

                      <button
                        type="button"
                        disabled={
                          isActionPending
                        }
                        onClick={() =>
                          setAction({
                            type: 'cancel',
                            invitation,
                          })
                        }
                        className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {actionError && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {getWorkspaceErrorMessage(
            actionError,
          )}
        </div>
      )}

      <ConfirmationDialog
        isOpen={action !== null}
        title={
          action?.type === 'cancel'
            ? 'Cancel this invitation?'
            : 'Send a new invitation email?'
        }
        description={
          action?.type === 'cancel'
            ? `${action.invitation.email} will no longer be able to use the current invitation link.`
            : `The old invitation link for ${action?.invitation.email} will stop working and a new link will be emailed.`
        }
        confirmLabel={
          action?.type === 'cancel'
            ? 'Cancel invitation'
            : 'Resend invitation'
        }
        tone={
          action?.type === 'cancel'
            ? 'danger'
            : 'primary'
        }
        isPending={isActionPending}
        onConfirm={() =>
          void confirmAction()
        }
        onClose={() => {
          if (!isActionPending) {
            setAction(null);
          }
        }}
      />
    </section>
  );
}