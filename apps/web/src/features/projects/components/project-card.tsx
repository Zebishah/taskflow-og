import { Link } from "react-router-dom";

import type { Project } from "../project.types";
import { isProjectArchived } from "../project.types";

interface ProjectCardProps {
  project: Project;
  canManage: boolean;
  animationDelay: number;
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
  onRestore: (project: Project) => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ProjectCard({
  project,
  canManage,
  animationDelay,
  onEdit,
  onArchive,
  onRestore,
}: ProjectCardProps): React.JSX.Element {
  const archived = isProjectArchived(project);

  return (
    <article
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
      className={[
        "group relative overflow-hidden rounded-[28px] border bg-white p-6 opacity-0 shadow-sm animate-[fade-up_.5s_ease-out_forwards] transition duration-300 hover:-translate-y-1 hover:shadow-xl",
        archived
          ? "border-slate-200 opacity-80"
          : "border-slate-200 hover:border-violet-200",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-violet-300/20 to-emerald-300/20 blur-2xl transition group-hover:scale-125" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-xl bg-slate-950 px-3 py-2 font-mono text-xs font-bold tracking-wider text-white">
            {project.key}
          </span>

          <span
            className={[
              "rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em]",
              archived
                ? "bg-slate-100 text-slate-600"
                : "bg-emerald-50 text-emerald-700",
            ].join(" ")}
          >
            {archived ? "Archived" : "Active"}
          </span>
        </div>

        <Link
          to={`/workspaces/${project.workspaceId}/projects/${project.id}`}
          className="mt-6 block"
        >
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950 transition group-hover:text-violet-700">
            {project.name}
          </h2>

          <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">
            {project.description ||
              "No project description has been added yet."}
          </p>
        </Link>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-400">
            Updated {formatDate(project.updatedAt)}
          </p>

          <Link
            to={`/workspaces/${project.workspaceId}/projects/${project.id}`}
            className="text-sm font-semibold text-violet-600 transition hover:text-violet-800"
          >
            Open project →
          </Link>
        </div>

        {canManage && (
          <div className="mt-4 flex flex-wrap gap-2">
            {!archived && (
              <button
                type="button"
                onClick={() => onEdit(project)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                Edit
              </button>
            )}

            {archived ? (
              <button
                type="button"
                onClick={() => onRestore(project)}
                className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Restore
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onArchive(project)}
                className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Archive
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
