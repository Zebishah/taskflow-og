import {
  useState,
} from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  ConfirmationDialog,
} from '../../../shared/components/confirmation-dialog';
import {
  createAuthPath,
} from '../../../shared/routing/return-path';
import { useAuth } from '../../auth/use-auth';
import {
  getWorkspaceErrorMessage,
} from '../../workspaces/workspace-api';

import {
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  useInvitationPreviewQuery,
} from '../hooks/use-workspace-collaboration';

function BrandMark(): React.JSX.Element {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 text-white shadow-xl shadow-violet-950/30">
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      >
        <path d="m7 12 3 3 7-7" />
        <path d="M19 12a7 7 0 1 1-3.5-6.06" />
      </svg>
    </span>
  );
}

export function InvitationPage(): React.JSX.Element {
  const { token } =
    useParams<{ token: string }>();

  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    isInitializing,
  } = useAuth();

  const previewQuery =
    useInvitationPreviewQuery(token);

  const acceptMutation =
    useAcceptInvitationMutation(token ?? '');

  const declineMutation =
    useDeclineInvitationMutation(token ?? '');

  const [confirmation, setConfirmation] =
    useState<'accept' | 'decline' | null>(
      null,
    );

  const returnTo = token
    ? `/invitations/${encodeURIComponent(token)}`
    : '/dashboard';

  if (
    isInitializing ||
    previewQuery.isLoading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a19] p-6">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />
          <p className="text-sm text-slate-300">
            Loading invitation...
          </p>
        </div>
      </main>
    );
  }

  if (
    !token ||
    previewQuery.isError ||
    !previewQuery.data
  ) {
    return (
      <main className="noise-overlay relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080a19] p-5">
        <section className="relative z-10 w-full max-w-lg rounded-[30px] border border-white/70 bg-white p-8 text-center shadow-2xl">
          <BrandMark />

          <h1 className="mt-6 text-2xl font-semibold text-slate-950">
            Invitation unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {getWorkspaceErrorMessage(
              previewQuery.error,
            )}
          </p>

          <Link
            to="/dashboard"
            className="mt-7 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Go to TaskFlow
          </Link>
        </section>
      </main>
    );
  }

  const invitation = previewQuery.data;

  const isUsable =
    invitation.status === 'pending';

  const emailMatches =
    user?.email.trim().toLowerCase() ===
    invitation.recipientEmail
      .trim()
      .toLowerCase();

  const actionError =
    acceptMutation.error ??
    declineMutation.error;

  const isPending =
    acceptMutation.isPending ||
    declineMutation.isPending;

  async function confirmAction(): Promise<void> {
    if (!confirmation) {
      return;
    }

    try {
      if (confirmation === 'accept') {
        const result =
          await acceptMutation.mutateAsync();

        navigate(
          `/workspaces/${result.workspaceId}`,
          {
            replace: true,
          },
        );
      } else {
        await declineMutation.mutateAsync();
        setConfirmation(null);
        await previewQuery.refetch();
      }
    } catch {
      // Error remains visible.
      setConfirmation(null);
    }
  }

  return (
    <main className="noise-overlay relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080a19] p-5">
      <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-violet-600/25 blur-[110px]" />
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-emerald-400/20 blur-[110px]" />

      <section className="relative z-10 w-full max-w-2xl animate-[fade-up_.5s_ease-out_both] overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)]">
        <header className="relative overflow-hidden bg-gradient-to-br from-[#15152c] via-[#201746] to-[#30225d] p-7 text-white sm:p-10">
          <div className="auth-grid absolute inset-0 opacity-50" />

          <div className="relative">
            <BrandMark />

            <p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-emerald-300">
              Workspace invitation
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
              Join {invitation.workspace.name}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
              {invitation.inviter.firstName}{' '}
              {invitation.inviter.lastName}{' '}
              invited you to collaborate as{' '}
              <span className="font-semibold text-white">
                {invitation.role}
              </span>
              .
            </p>
          </div>
        </header>

        <div className="p-6 sm:p-9">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Invited email
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                {invitation.recipientEmail}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Status
              </p>

              <p className="mt-2 text-sm font-semibold capitalize text-slate-800">
                {invitation.status}
              </p>
            </div>
          </div>

          {invitation.workspace.description && (
            <p className="mt-5 rounded-2xl bg-violet-50/70 p-4 text-sm leading-6 text-violet-900">
              {invitation.workspace.description}
            </p>
          )}

          {!isUsable ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-900">
                This invitation is{' '}
                {invitation.status}.
              </p>

              <p className="mt-1 text-sm text-amber-700">
                Ask a workspace administrator to
                send a new invitation if you still
                need access.
              </p>
            </div>
          ) : !isAuthenticated ? (
            <div className="mt-7">
              <p className="text-sm leading-6 text-slate-600">
                Sign in or create an account using{' '}
                <strong>
                  {invitation.recipientEmail}
                </strong>
                . You will automatically return to
                this invitation afterward.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  to={createAuthPath(
                    '/login',
                    returnTo,
                  )}
                  className="flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Sign in to continue
                </Link>

                <Link
                  to={createAuthPath(
                    '/register',
                    returnTo,
                  )}
                  className="flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Create account
                </Link>
              </div>
            </div>
          ) : !emailMatches ? (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4"
            >
              <p className="font-semibold text-rose-900">
                Wrong account
              </p>

              <p className="mt-1 text-sm leading-6 text-rose-700">
                You are signed in as{' '}
                <strong>{user?.email}</strong>, but
                this invitation was sent to{' '}
                <strong>
                  {invitation.recipientEmail}
                </strong>
                . Sign out and use the invited email.
              </p>
            </div>
          ) : (
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  setConfirmation('accept')
                }
                className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                Accept and join workspace
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  setConfirmation('decline')
                }
                className="rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          )}

          {actionError && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              {getWorkspaceErrorMessage(
                actionError,
              )}
            </div>
          )}
        </div>
      </section>

      <ConfirmationDialog
        isOpen={confirmation !== null}
        title={
          confirmation === 'accept'
            ? `Join ${invitation.workspace.name}?`
            : 'Decline this invitation?'
        }
        description={
          confirmation === 'accept'
            ? `You will join as ${invitation.role} and receive access to this workspace.`
            : 'The invitation will no longer be available after you decline it.'
        }
        confirmLabel={
          confirmation === 'accept'
            ? 'Accept invitation'
            : 'Decline invitation'
        }
        tone={
          confirmation === 'decline'
            ? 'danger'
            : 'primary'
        }
        isPending={isPending}
        onConfirm={() =>
          void confirmAction()
        }
        onClose={() => {
          if (!isPending) {
            setConfirmation(null);
          }
        }}
      />
    </main>
  );
}