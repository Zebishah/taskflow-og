import { Link, useParams } from "react-router-dom";

import { useWorkspaceQuery } from "../hooks/use-workspaces";
import { getWorkspaceErrorMessage } from "../workspace-api";
import { useProjectsQuery } from "../../projects/hooks/use-projects";

function OverviewSkeleton(): React.JSX.Element {
  return (
    <div className="animate-pulse">
      <div className="h-5 w-40 rounded bg-slate-200" />
      <div className="mt-5 h-10 w-80 max-w-full rounded bg-slate-200" />
      <div className="mt-4 h-4 w-96 max-w-full rounded bg-slate-100" />

      <div className="mt-9 grid gap-5 md:grid-cols-3">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <div
            key={index}
            className="h-36 rounded-[26px] border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}

export function WorkspaceOverviewPage(): React.JSX.Element {
  const { workspaceId } = useParams<{
    workspaceId: string;
  }>();

  const workspaceQuery = useWorkspaceQuery(workspaceId);
  const projectsQuery = useProjectsQuery(workspaceId);
  if (workspaceQuery.isLoading) {
    return <OverviewSkeleton />;
  }

  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-950">
          Workspace unavailable
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          {getWorkspaceErrorMessage(workspaceQuery.error)}
        </p>

        <Link
          to="/workspaces"
          className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Return to workspaces
        </Link>
      </div>
    );
  }

  const workspace = workspaceQuery.data;
  const activeProjectCount =
    projectsQuery.data?.filter((project) => project.archivedAt === null)
      .length ?? 0;
  return (
    <section>
      <div className="relative overflow-hidden rounded-[32px] bg-[#0a0c20] p-7 text-white shadow-[0_35px_90px_-45px_rgba(15,23,42,.8)] sm:p-10">
        <div className="pointer-events-none absolute -left-16 -top-24 h-80 w-80 rounded-full bg-violet-600/35 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-[90px]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                Active workspace
              </span>

              <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
                {workspace.role}
              </span>
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {workspace.name}
            </h1>

            <p className="mt-3 text-sm font-medium text-slate-400">
              /{workspace.slug}
            </p>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {workspace.description ||
                "This workspace is ready for your team, projects, and upcoming tasks."}
            </p>
          </div>

          {workspace.role === "owner" && (
            <Link
              to={`/workspaces/${workspace.id}/settings`}
              className="flex w-fit items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="10" cy="10" r="3" />
                <path d="M16.5 11.5a6.8 6.8 0 0 0 0-3l1.7-1.3-2-3.4-2.1.9a7.6 7.6 0 0 0-2.6-1.5L11.2 1H7.3L7 3.2a7.6 7.6 0 0 0-2.6 1.5l-2.1-.9-2 3.4L2 8.5a6.8 6.8 0 0 0 0 3L.3 12.8l2 3.4 2.1-.9A7.6 7.6 0 0 0 7 16.8l.3 2.2h3.9l.3-2.2a7.6 7.6 0 0 0 2.6-1.5l2.1.9 2-3.4-1.7-1.3Z" />
              </svg>
              Workspace settings
            </Link>
          )}
        </div>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-3">
        {[
          {
            label: "Members",
            value: workspace.memberCount,
            helper: "People collaborating here",
            iconColor: "bg-violet-100 text-violet-600",
            icon: (
              <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </>
            ),
          },
          {
            label: "Active projects",
            value: projectsQuery.isLoading ? "—" : activeProjectCount,
            helper: "Projects currently in progress",
            iconColor: "bg-cyan-100 text-cyan-600",
            icon: (
              <>
                <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5Z" />
                <path d="m9.5 13 1.75 1.75L15 11" />
              </>
            ),
          },
          {
            label: "Your role",
            value: workspace.role[0]?.toUpperCase() + workspace.role.slice(1),
            helper: "Workspace permission level",
            iconColor: "bg-emerald-100 text-emerald-600",
            icon: (
              <>
                <path d="M12 3 5 6v5c0 4.55 2.98 8.74 7 10 4.02-1.26 7-5.45 7-10V6Z" />
                <path d="m9 12 2 2 4-4" />
              </>
            ),
          },
        ].map((stat, index) => (
          <article
            key={stat.label}
            style={{
              animationDelay: `${index * 80}ms`,
            }}
            className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 opacity-0 shadow-sm animate-[fade-up_.55s_ease-out_forwards] transition duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <span
              className={`absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl ${stat.iconColor} transition duration-300 group-hover:scale-110`}
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {stat.icon}
              </svg>
            </span>

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {stat.label}
            </p>

            <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              {stat.value}
            </p>

            <p className="mt-2 text-sm text-slate-500">{stat.helper}</p>
          </article>
        ))}
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.025em] text-slate-950">
                Recent activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Workspace events will appear here.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              Coming soon
            </span>
          </div>

          <div className="mt-8 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 8v5l3 2" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </span>

            <p className="mt-4 text-sm font-semibold text-slate-800">
              No activity yet
            </p>

            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
              Member invitations, projects, and task activity will appear in
              this timeline.
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-7">
          <h2 className="text-lg font-semibold tracking-[-0.025em] text-slate-950">
            Quick actions
          </h2>

          <div className="mt-6 space-y-3">
            <Link
              to={
                workspace.role === "member"
                  ? `/workspaces/${workspace.id}/members`
                  : `/workspaces/${workspace.id}/invitations`
              }
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:border-violet-200 hover:bg-violet-50/50"
            >
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  {workspace.role === "member"
                    ? "View members"
                    : "Invite members"}
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  {workspace.role === "member"
                    ? "See everyone in this workspace"
                    : "Manage workspace invitations"}
                </span>
              </span>

              <span className="text-violet-600" aria-hidden="true">
                →
              </span>
            </Link>

            <Link
              to={`/workspaces/${workspace.id}/members`}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Workspace members
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  View roles and workspace access
                </span>
              </span>

              <span className="text-emerald-600" aria-hidden="true">
                →
              </span>
            </Link>
            <Link
              to={`/workspaces/${workspace.id}/projects`}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:border-cyan-200 hover:bg-cyan-50/50"
            >
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  {workspace.role === "member"
                    ? "View projects"
                    : "Manage projects"}
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  {workspace.role === "member"
                    ? "Explore this workspace’s projects"
                    : "Create, update, archive, and restore projects"}
                </span>
              </span>

              <span className="text-cyan-600" aria-hidden="true">
                →
              </span>
            </Link>

            {workspace.role === "owner" && (
              <Link
                to={`/workspaces/${workspace.id}/settings`}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:border-violet-200 hover:bg-violet-50/50"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Workspace settings
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Update name and description
                  </span>
                </span>

                <span className="text-violet-600">→</span>
              </Link>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
