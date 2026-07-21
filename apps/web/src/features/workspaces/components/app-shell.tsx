import {
  useState,
  type ReactNode,
} from 'react';
import {
  Link,
  NavLink,
  Outlet,
} from 'react-router-dom';

import { useAuth } from '../../auth/use-auth';
import { useWorkspacesQuery } from '../hooks/use-workspaces';

interface NavigationItem {
  label: string;
  to: string;
  icon: ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="2"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="2"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="2"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="2"
        />
      </svg>
    ),
  },
  {
    label: 'Workspaces',
    to: '/workspaces',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 7.5h16M7 4v7M17 4v7" />
        <rect
          x="3"
          y="4"
          width="18"
          height="17"
          rx="3"
        />
        <path d="M7 15h4M7 18h8" />
      </svg>
    ),
  },
];

function BrandMark(): React.JSX.Element {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 shadow-lg shadow-violet-950/30">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m7 12 3 3 7-7" />
        <path d="M19 12a7 7 0 1 1-3.5-6.06" />
      </svg>
    </span>
  );
}

function getInitials(
  firstName?: string,
  lastName?: string,
): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`
    .toUpperCase()
    .trim();
}

export function AppShell(): React.JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const { user } = useAuth();
  const workspacesQuery = useWorkspacesQuery();

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : 'TaskFlow User';

  const sidebarContent = (
    <>
      <div className="flex h-20 items-center justify-between border-b border-white/[0.08] px-5">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 font-bold tracking-tight text-white"
          onClick={() =>
            setIsMobileMenuOpen(false)
          }
        >
          <BrandMark />

          <span className="text-lg">
            Task
            <span className="text-emerald-300">
              Flow
            </span>
          </span>
        </Link>

        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setIsMobileMenuOpen(false)
          }
          className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m5 5 10 10M15 5 5 15" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Navigation
        </p>

        <nav className="space-y-1.5">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() =>
                setIsMobileMenuOpen(false)
              }
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition duration-200',
                  isActive
                    ? 'bg-white/[0.1] text-white shadow-inner shadow-white/5'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
                ].join(' ')
              }
            >
              <span className="transition group-hover:scale-105">
                {item.icon}
              </span>

              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between px-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Your workspaces
            </p>

            <Link
              to="/workspaces/new"
              aria-label="Create workspace"
              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-emerald-300"
            >
              +
            </Link>
          </div>

          <div className="space-y-1">
            {workspacesQuery.data
              ?.slice(0, 5)
              .map((workspace) => (
                <NavLink
                  key={workspace.id}
                  to={`/workspaces/${workspace.id}`}
                  onClick={() =>
                    setIsMobileMenuOpen(false)
                  }
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                      isActive
                        ? 'bg-violet-400/15 text-violet-200'
                        : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
                    ].join(' ')
                  }
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-emerald-300 to-violet-400 shadow-[0_0_10px_rgba(167,139,250,.45)]" />

                  <span className="truncate">
                    {workspace.name}
                  </span>
                </NavLink>
              ))}

            {!workspacesQuery.isLoading &&
              workspacesQuery.data?.length ===
                0 && (
                <p className="px-3 py-2 text-xs leading-5 text-slate-600">
                  Create your first workspace to
                  begin.
                </p>
              )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.08] p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.045] p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-violet-500 text-xs font-bold text-white">
            {getInitials(
              user?.firstName,
              user?.lastName,
            ) || 'TF'}
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>

            <p className="truncate text-xs text-slate-500">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-200/40 blur-[110px]" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-emerald-200/35 blur-[110px]" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col overflow-hidden border-r border-white/[0.08] bg-[#090b1d] lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,.12),transparent_35%)]" />

        <div className="relative flex h-full flex-col">
          {sidebarContent}
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() =>
              setIsMobileMenuOpen(false)
            }
          />

          <aside className="relative flex h-full w-[min(86vw,320px)] animate-[slide-in_.25s_ease-out] flex-col bg-[#090b1d] shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="relative lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/75 bg-white/75 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() =>
                setIsMobileMenuOpen(true)
              }
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-violet-600 lg:hidden"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
                TaskFlow
              </p>

              <p className="mt-0.5 text-sm text-slate-500">
                Plan clearly. Move confidently.
              </p>
            </div>
          </div>

          <Link
            to="/workspaces/new"
            className="group flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-200"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-4 w-4 transition group-hover:rotate-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 4v12M4 10h12" />
            </svg>

            <span className="hidden sm:inline">
              New workspace
            </span>
          </Link>
        </header>

        <main className="relative mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}