import {
  Link,
  useParams,
} from "react-router-dom";

import { getWorkspaceErrorMessage } from "../../workspaces/workspace-api";
import { useProjectQuery } from "../hooks/use-projects";
import { isProjectArchived } from "../project.types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "long",
    },
  ).format(new Date(value));
}

export function ProjectOverviewPage(): React.JSX.Element {
  const {
    workspaceId,
    projectId,
  } = useParams<{
    workspaceId: string;
    projectId: string;
  }>();

  const projectQuery =
    useProjectQuery(
      workspaceId,
      projectId,
    );

  if (projectQuery.isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-5 w-52 rounded bg-slate-200" />
        <div className="mt-6 h-56 rounded-[32px] bg-slate-900" />
        <div className="mt-7 h-72 rounded-[28px] bg-white" />
      </div>
    );
  }

  if (
    !workspaceId ||
    !projectId ||
    projectQuery.isError ||
    !projectQuery.data
  ) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-950">
          Project unavailable
        </h1>

        <p className="mt-3 text-sm text-rose-700">
          {getWorkspaceErrorMessage(
            projectQuery.error,
          )}
        </p>

        <Link
          to={`/workspaces/${workspaceId ?? ""}/projects`}
          className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Return to projects
        </Link>
      </div>
    );
  }

  const project = projectQuery.data;
  const archived =
    isProjectArchived(project);

  return (
    <section>
      <Link
        to={`/workspaces/${workspaceId}/projects`}
        className="text-sm font-semibold text-violet-600 transition hover:text-violet-800"
      >
        ← Back to projects
      </Link>

      <div className="relative mt-5 overflow-hidden rounded-[32px] bg-[#0a0c20] p-7 text-white shadow-[0_35px_90px_-45px_rgba(15,23,42,.8)] sm:p-10">
        <div className="pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full bg-violet-600/35 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-[90px]" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl bg-white px-3 py-2 font-mono text-xs font-bold tracking-wider text-slate-950">
              {project.key}
            </span>

            <span
              className={[
                "rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]",
                archived
                  ? "border-slate-300/20 bg-slate-300/10 text-slate-300"
                  : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
              ].join(" ")}
            >
              {archived
                ? "Archived"
                : "Active"}
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
            {project.name}
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            {project.description ||
              "No description has been added to this project."}
          </p>

          <div className="mt-8 flex flex-wrap gap-5 text-xs text-slate-400">
            <span>
              Created{" "}
              {formatDate(
                project.createdAt,
              )}
            </span>

            <span>
              Updated{" "}
              {formatDate(
                project.updatedAt,
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-7 rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-emerald-100 text-3xl">
            ✓
          </span>

          <h2 className="mt-5 text-xl font-semibold text-slate-950">
            Project workspace ready
          </h2>

          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Tasks, assignees, priorities and labels will appear here in the next milestone.
          </p>

          {archived && (
            <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              This project is archived. Restore it from the projects page before adding new work.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}