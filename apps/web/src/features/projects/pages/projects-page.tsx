import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ConfirmationDialog } from "../../../shared/components/confirmation-dialog";
import { getWorkspaceErrorMessage } from "../../workspaces/workspace-api";
import { useWorkspaceQuery } from "../../workspaces/hooks/use-workspaces";
import { ProjectCard } from "../components/project-card";
import { ProjectFormDialog } from "../components/project-form-dialog";
import {
  useArchiveProjectMutation,
  useCreateProjectMutation,
  useProjectsQuery,
  useRestoreProjectMutation,
  useUpdateProjectMutation,
} from "../hooks/use-projects";
import type { CreateProjectInput, Project } from "../project.types";
import { isProjectArchived } from "../project.types";
import { useAppDispatch, useAppSelector } from "../../../app/redux-hooks";

import {
  projectFilterChanged,
  projectSearchChanged,
} from "../project-browser.slice";

import {
  selectProjectFilter,
  selectProjectSearch,
  selectVisibleProjects,
} from "../project-browser.selectors";
type FormState =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      project: Project;
    }
  | null;

interface ProjectAction {
  type: "archive" | "restore";
  project: Project;
}

function ProjectsSkeleton(): React.JSX.Element {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-72 rounded bg-slate-200" />
      <div className="mt-4 h-5 w-96 max-w-full rounded bg-slate-100" />

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="h-72 rounded-[28px] border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}

export function ProjectsPage(): React.JSX.Element {
  const { workspaceId } = useParams<{
    workspaceId: string;
  }>();

  const workspaceQuery = useWorkspaceQuery(workspaceId);

  const projectsQuery = useProjectsQuery(workspaceId);

  const createMutation = useCreateProjectMutation();

  const updateMutation = useUpdateProjectMutation();

  const archiveMutation = useArchiveProjectMutation();

  const restoreMutation = useRestoreProjectMutation();

  const [formState, setFormState] = useState<FormState>(null);

  const [action, setAction] = useState<ProjectAction | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const projects = projectsQuery.data ?? [];
  const dispatch = useAppDispatch();

  const search = useAppSelector(selectProjectSearch);

  const filter = useAppSelector(selectProjectFilter);
  const visibleProjects = useAppSelector((state) =>
    selectVisibleProjects(state, projects),
  );

  if (workspaceQuery.isLoading || projectsQuery.isLoading) {
    return <ProjectsSkeleton />;
  }

  if (!workspaceId || workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-950">
          Workspace unavailable
        </h1>

        <p className="mt-3 text-sm text-rose-700">
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

  const canManage = workspace.role === "owner" || workspace.role === "admin";

  async function handleFormSubmit(input: CreateProjectInput): Promise<void> {
    if (!formState) {
      return;
    }

    if (formState.mode === "create") {
      const project = await createMutation.mutateAsync({
        workspaceId: workspace.id,
        input,
      });

      setSuccessMessage(`${project.name} was created successfully.`);
    } else {
      const project = await updateMutation.mutateAsync({
        workspaceId: workspace.id,
        projectId: formState.project.id,
        input,
      });

      setSuccessMessage(`${project.name} was updated successfully.`);
    }

    setFormState(null);
  }

  async function confirmAction(): Promise<void> {
    if (!action) {
      return;
    }

    const variables = {
      workspaceId: workspace.id,
      projectId: action.project.id,
    };

    try {
      if (action.type === "archive") {
        await archiveMutation.mutateAsync(variables);

        setSuccessMessage(`${action.project.name} was archived.`);
      } else {
        await restoreMutation.mutateAsync(variables);

        setSuccessMessage(`${action.project.name} was restored.`);
      }

      setAction(null);
    } catch {
      // Mutation error is rendered below.
    }
  }

  const formError = createMutation.error ?? updateMutation.error;

  const actionError = archiveMutation.error ?? restoreMutation.error;

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  const isActionPending =
    archiveMutation.isPending || restoreMutation.isPending;

  const activeCount = projects.filter(
    (project) => !isProjectArchived(project),
  ).length;

  const archivedCount = projects.length - activeCount;

  return (
    <section>
      <div className="relative overflow-hidden rounded-[32px] bg-[#0a0c20] p-7 text-white shadow-[0_35px_90px_-45px_rgba(15,23,42,.8)] sm:p-9">
        <div className="pointer-events-none absolute -left-20 -top-28 h-80 w-80 rounded-full bg-violet-600/35 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-[90px]" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              to={`/workspaces/${workspace.id}`}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200 transition hover:text-white"
            >
              ← {workspace.name}
            </Link>

            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Projects
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Organize your team’s work into focused projects before creating
              tasks.
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => {
                createMutation.reset();
                updateMutation.reset();
                setSuccessMessage(null);
                setFormState({
                  mode: "create",
                });
              }}
              className="shine-button flex w-fit items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl transition hover:-translate-y-0.5"
            >
              <span className="text-lg">+</span>
              Create project
            </button>
          )}
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total projects",
            value: projects.length,
            color: "from-violet-500 to-indigo-500",
          },
          {
            label: "Active",
            value: activeCount,
            color: "from-emerald-500 to-teal-500",
          },
          {
            label: "Archived",
            value: archivedCount,
            color: "from-slate-500 to-slate-700",
          },
        ].map((stat) => (
          <article
            key={stat.label}
            className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <span
              className={`absolute -right-5 -top-5 h-20 w-20 rounded-full bg-gradient-to-br ${stat.color} opacity-10`}
            />

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {stat.label}
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              {stat.value}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-7 flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="9" r="5" />
            <path d="m13 13 4 4" />
          </svg>

          <input
            type="search"
            value={search}
            placeholder="Search projects by name, key, or description..."
            onChange={(event) =>
              dispatch(projectSearchChanged(event.target.value))
            }
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
          />
        </div>

        <div className="flex rounded-2xl bg-slate-100 p-1">
          {(["active", "archived", "all"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => dispatch(projectFilterChanged(item))}
              className={[
                "rounded-xl px-3 py-2 text-xs font-semibold capitalize transition sm:px-4",
                filter === item
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {successMessage && (
        <div
          role="status"
          className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          <span>{successMessage}</span>

          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setSuccessMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {getWorkspaceErrorMessage(actionError)}
        </div>
      )}

      {projectsQuery.isError ? (
        <div className="mt-7 rounded-[28px] border border-rose-200 bg-white p-10 text-center">
          <h2 className="font-semibold text-slate-950">
            Projects could not be loaded
          </h2>

          <p className="mt-2 text-sm text-rose-700">
            {getWorkspaceErrorMessage(projectsQuery.error)}
          </p>

          <button
            type="button"
            onClick={() => void projectsQuery.refetch()}
            className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className="mt-7 rounded-[30px] border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-emerald-100 text-3xl">
            ◇
          </span>

          <h2 className="mt-5 text-xl font-semibold text-slate-950">
            {projects.length === 0 ? "No projects yet" : "No matching projects"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {projects.length === 0
              ? canManage
                ? "Create the first project and give your team a clear place to organize tasks."
                : "An owner or administrator has not created a project yet."
              : "Change your search or filter to find another project."}
          </p>

          {canManage && projects.length === 0 && (
            <button
              type="button"
              onClick={() =>
                setFormState({
                  mode: "create",
                })
              }
              className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
            >
              Create first project
            </button>
          )}
        </div>
      ) : (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              canManage={canManage}
              animationDelay={index * 70}
              onEdit={(selected) => {
                createMutation.reset();
                updateMutation.reset();
                setSuccessMessage(null);
                setFormState({
                  mode: "edit",
                  project: selected,
                });
              }}
              onArchive={(selected) => {
                archiveMutation.reset();
                restoreMutation.reset();
                setAction({
                  type: "archive",
                  project: selected,
                });
              }}
              onRestore={(selected) => {
                archiveMutation.reset();
                restoreMutation.reset();
                setAction({
                  type: "restore",
                  project: selected,
                });
              }}
            />
          ))}
        </div>
      )}

      {formState !== null && (
        <ProjectFormDialog
          key={
            formState.mode === "edit"
              ? `edit-${formState.project.id}`
              : "create"
          }
          project={formState.mode === "edit" ? formState.project : undefined}
          isPending={isFormPending}
          error={formError}
          onSubmit={handleFormSubmit}
          onClose={() => {
            if (!isFormPending) {
              setFormState(null);
            }
          }}
        />
      )}

      <ConfirmationDialog
        isOpen={action !== null}
        title={
          action?.type === "archive"
            ? "Archive this project?"
            : "Restore this project?"
        }
        description={
          action?.type === "archive"
            ? `${action.project.name} will become read-only until it is restored. Existing data will be preserved.`
            : `${action?.project.name} will become active and available to the workspace again.`
        }
        confirmLabel={
          action?.type === "archive" ? "Archive project" : "Restore project"
        }
        tone={action?.type === "archive" ? "danger" : "primary"}
        isPending={isActionPending}
        onConfirm={() => void confirmAction()}
        onClose={() => {
          if (!isActionPending) {
            setAction(null);
          }
        }}
      />
    </section>
  );
}
