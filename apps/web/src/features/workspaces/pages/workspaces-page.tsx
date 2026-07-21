import { Link } from 'react-router-dom';

import { WorkspaceCard } from '../components/workspace-card';
import { useWorkspacesQuery } from '../hooks/use-workspaces';
import { getWorkspaceErrorMessage } from '../workspace-api';

function WorkspaceSkeleton(): React.JSX.Element {
  return (
    <div className="animate-pulse rounded-[26px] border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-4">
        <div className="h-13 w-13 rounded-2xl bg-slate-200" />

        <div className="flex-1">
          <div className="h-4 w-36 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-24 rounded bg-slate-100" />
        </div>
      </div>

      <div className="mt-7 h-3 w-full rounded bg-slate-100" />
      <div className="mt-3 h-3 w-3/4 rounded bg-slate-100" />

      <div className="mt-7 h-px bg-slate-100" />

      <div className="mt-5 h-3 w-24 rounded bg-slate-100" />
    </div>
  );
}

export function WorkspacesPage(): React.JSX.Element {
  const workspacesQuery = useWorkspacesQuery();

  return (
    <section>
      <header className="mb-9 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-[fade-up_.45s_ease-out_both]">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            Collaboration spaces
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-5xl">
            Your workspaces
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Keep every team, project, and decision
            organized inside focused collaborative
            spaces.
          </p>
        </div>

        <Link
          to="/workspaces/new"
          className="flex w-fit items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-200"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 4v12M4 10h12" />
          </svg>

          Create workspace
        </Link>
      </header>

      {workspacesQuery.isLoading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <WorkspaceSkeleton
              key={index}
            />
          ))}
        </div>
      )}

      {workspacesQuery.isError && (
        <div className="rounded-[28px] border border-rose-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              />
              <path d="M12 7v6M12 17h.01" />
            </svg>
          </span>

          <h2 className="mt-5 text-lg font-semibold text-slate-950">
            We couldn’t load your workspaces
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {getWorkspaceErrorMessage(
              workspacesQuery.error,
            )}
          </p>

          <button
            type="button"
            onClick={() =>
              void workspacesQuery.refetch()
            }
            className="mt-6 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Try again
          </button>
        </div>
      )}

      {!workspacesQuery.isLoading &&
        !workspacesQuery.isError &&
        workspacesQuery.data?.length === 0 && (
          <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white px-6 py-16 text-center shadow-[0_25px_70px_-45px_rgba(15,23,42,.4)] sm:px-12">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-100 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />

            <div className="relative">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-400 text-white shadow-xl shadow-violet-200 animate-[float_4s_ease-in-out_infinite]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-9 w-9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="17"
                    rx="3"
                  />
                  <path d="M7 4v7M17 4v7M3 9h18M7 15h4M7 18h8" />
                </svg>
              </span>

              <h2 className="mt-7 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
                Create your first workspace
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Bring your team, projects, and tasks
                together in one beautifully organized
                space.
              </p>

              <Link
                to="/workspaces/new"
                className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition duration-200 hover:-translate-y-1 hover:bg-violet-700 hover:shadow-violet-200"
              >
                Create workspace
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}

      {workspacesQuery.data &&
        workspacesQuery.data.length > 0 && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-900">
                  {workspacesQuery.data.length}
                </span>{' '}
                {workspacesQuery.data.length === 1
                  ? 'workspace'
                  : 'workspaces'}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {workspacesQuery.data.map(
                (workspace, index) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    index={index}
                  />
                ),
              )}
            </div>
          </>
        )}
    </section>
  );
}