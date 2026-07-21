import { Link } from 'react-router-dom';

import type {
  Workspace,
  WorkspaceRole,
} from '../workspace.types';

interface WorkspaceCardProps {
  workspace: Workspace;
  index: number;
}

const roleStyles: Record<
  WorkspaceRole,
  string
> = {
  owner:
    'border-violet-200 bg-violet-50 text-violet-700',
  admin:
    'border-cyan-200 bg-cyan-50 text-cyan-700',
  member:
    'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function getWorkspaceInitials(
  name: string,
): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

export function WorkspaceCard({
  workspace,
  index,
}: WorkspaceCardProps): React.JSX.Element {
  return (
    <Link
      to={`/workspaces/${workspace.id}`}
      style={{
        animationDelay: `${index * 70}ms`,
      }}
      className="group relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-6 opacity-0 shadow-[0_18px_50px_-35px_rgba(15,23,42,.45)] transition duration-300 animate-[fade-up_.55s_ease-out_forwards] hover:-translate-y-1.5 hover:border-violet-200 hover:shadow-[0_30px_70px_-35px_rgba(109,40,217,.4)]"
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-gradient-to-br from-violet-100 via-cyan-50 to-emerald-50 opacity-70 blur-2xl transition duration-500 group-hover:scale-125 group-hover:opacity-100" />

      <div className="relative">
        <div className="flex items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-400 text-sm font-bold tracking-wide text-white shadow-lg shadow-violet-200 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
              {getWorkspaceInitials(
                workspace.name,
              )}
            </span>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-[-0.025em] text-slate-950">
                {workspace.name}
              </h2>

              <p className="mt-1 truncate text-xs font-medium text-slate-400">
                /{workspace.slug}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${roleStyles[workspace.role]}`}
          >
            {workspace.role}
          </span>
        </div>

        <p className="mt-6 min-h-12 text-sm leading-6 text-slate-500">
          {workspace.description ||
            'A focused space for your team, projects, and upcoming work.'}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
          <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.65)]" />
            Active workspace
          </span>

          <span className="flex items-center gap-2 text-sm font-semibold text-violet-600 transition-all group-hover:gap-3">
            Open
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}