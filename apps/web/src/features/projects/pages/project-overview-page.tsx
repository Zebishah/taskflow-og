import { useDeferredValue, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ConfirmationDialog } from "../../../shared/components/confirmation-dialog";
import { useWorkspaceMembersQuery } from "../../workspace-collaboration/hooks/use-workspace-collaboration";

import { TaskFormDialog } from "../../tasks/components/task-form-dialog";
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useTasksQuery,
  useUpdateTaskMutation,
  useMoveTaskMutation,
} from "../../tasks/hooks/use-tasks";
import type {
  Task,
  TaskFormValues,
  TaskPriority,
} from "../../tasks/task.types";
import { taskPriorities, taskPriorityLabels } from "../../tasks/task.types";
import { WorkflowEditorDialog } from "../../project-columns/components/workflow-editor-dialog";
import { useWorkspaceQuery } from "../../workspaces/hooks/use-workspaces";
import { getWorkspaceErrorMessage } from "../../workspaces/workspace-api";
import { useProjectQuery } from "../hooks/use-projects";
import { isProjectArchived } from "../project.types";
import { TaskBoard } from "../../tasks/components/task-board";
import { useProjectColumnsQuery } from "../../project-columns/hooks/use-project-columns";
type TaskDialogState =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      task: Task;
    }
  | null;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
  }).format(new Date(value));
}

export function ProjectOverviewPage(): React.JSX.Element {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string;
    projectId: string;
  }>();

  const [search, setSearch] = useState("");

  const deferredSearch = useDeferredValue(search);

  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );
  const [isWorkflowEditorOpen, setWorkflowEditorOpen] = useState(false);

  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const [dialogState, setDialogState] = useState<TaskDialogState>(null);

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const projectQuery = useProjectQuery(workspaceId, projectId);

  const workspaceQuery = useWorkspaceQuery(workspaceId);

  const membersQuery = useWorkspaceMembersQuery(workspaceId);

  const taskFilters = useMemo(
    () => ({
      priority: priorityFilter === "all" ? undefined : priorityFilter,

      assigneeMemberId: assigneeFilter === "all" ? undefined : assigneeFilter,

      search: deferredSearch.trim() || undefined,
    }),
    [assigneeFilter, deferredSearch, priorityFilter],
  );

  const tasksQuery = useTasksQuery(workspaceId, projectId, taskFilters);

  const createTaskMutation = useCreateTaskMutation();

  const updateTaskMutation = useUpdateTaskMutation();

  const deleteTaskMutation = useDeleteTaskMutation();

  const moveTaskMutation = useMoveTaskMutation();
  const columnsQuery = useProjectColumnsQuery(workspaceId, projectId);
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};

    for (const column of columnsQuery.data ?? []) {
      grouped[column.id] = [];
    }

    for (const task of tasksQuery.data ?? []) {
      grouped[task.columnId]?.push(task);
    }

    return grouped;
  }, [columnsQuery.data, tasksQuery.data]);

  if (
    projectQuery.isLoading ||
    workspaceQuery.isLoading ||
    membersQuery.isLoading ||
    tasksQuery.isLoading ||
    columnsQuery.isLoading
  ) {
    return (
      <div className="animate-pulse">
        <div className="h-5 w-52 rounded bg-slate-200" />
        <div className="mt-6 h-56 rounded-[32px] bg-slate-900" />
        <div className="mt-7 h-20 rounded-[24px] bg-white" />

        <div className="mt-5 grid gap-4 xl:grid-cols-5">
          {Array.from(
            {
              length: 5,
            },
            (_, index) => (
              <div key={index} className="h-80 rounded-[24px] bg-white" />
            ),
          )}
        </div>
      </div>
    );
  }

  const pageError =
    projectQuery.error ??
    workspaceQuery.error ??
    membersQuery.error ??
    tasksQuery.error ??
    columnsQuery.error;

  if (
    !workspaceId ||
    !projectId ||
    projectQuery.isError ||
    !projectQuery.data ||
    workspaceQuery.isError ||
    !workspaceQuery.data ||
    membersQuery.isError ||
    tasksQuery.isError ||
    columnsQuery.isError ||
    !columnsQuery.data
  ) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-950">
          Project tasks unavailable
        </h1>

        <p className="mt-3 text-sm text-rose-700">
          {getWorkspaceErrorMessage(pageError)}
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
  const workspace = workspaceQuery.data;
  const members = membersQuery.data ?? [];

  const archived = isProjectArchived(project);

  const canManageProject =
    workspace.role === "owner" || workspace.role === "admin";

  const canDelete = canManageProject;

  const taskMutationError =
    createTaskMutation.error ??
    updateTaskMutation.error ??
    moveTaskMutation.error ??
    deleteTaskMutation.error;

  const isMutating =
    createTaskMutation.isPending ||
    updateTaskMutation.isPending ||
    moveTaskMutation.isPending ||
    deleteTaskMutation.isPending;

  // function findAssignee(task: Task) {
  //   return members.find((member) => member.id === task.assigneeMemberId);
  // }

  async function submitTask(values: TaskFormValues): Promise<void> {
    if (!workspaceId || !projectId || !dialogState) {
      return;
    }

    if (dialogState.mode === "create") {
      await createTaskMutation.mutateAsync({
        workspaceId,
        projectId,
        input: {
          title: values.title,
          description: values.description || undefined,
          columnId: values.columnId,
          priority: values.priority,
          assigneeMemberId: values.assigneeMemberId ?? undefined,
          dueAt: values.dueAt ?? undefined,
        },
      });

      setSuccessMessage("Task created successfully.");
    } else {
      await updateTaskMutation.mutateAsync({
        workspaceId,
        projectId,
        taskId: dialogState.task.id,
        input: {
          title: values.title,
          description: values.description || null,
          columnId: values.columnId,
          priority: values.priority,
          assigneeMemberId: values.assigneeMemberId,
          dueAt: values.dueAt,
        },
      });

      setSuccessMessage("Task updated successfully.");
    }

    setDialogState(null);
  }

  async function changeTaskColumn(task: Task, columnId: string): Promise<void> {
    if (!workspaceId || !projectId) {
      return;
    }

    const destination = columnsQuery.data?.find(
      (column) => column.id === columnId,
    );

    try {
      await moveTaskMutation.mutateAsync({
        workspaceId,
        projectId,
        task,
        columnId,
      });

      setSuccessMessage(
        `${project.key}-${task.taskNumber} moved to ${
          destination?.name ?? "another column"
        }.`,
      );
    } catch {
      // Optimistic update is rolled back by the mutation hook.
    }
  }

  async function confirmDelete(): Promise<void> {
    if (!workspaceId || !projectId || !taskToDelete) {
      return;
    }

    try {
      await deleteTaskMutation.mutateAsync({
        workspaceId,
        projectId,
        taskId: taskToDelete.id,
      });

      setSuccessMessage(
        `${project.key}-${taskToDelete.taskNumber} was deleted.`,
      );

      setTaskToDelete(null);
    } catch {
      // Mutation error is rendered below.
    }
  }

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

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
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
                {archived ? "Archived" : "Active"}
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                {(tasksQuery.data ?? []).length} tasks
              </span>
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {project.name}
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              {project.description ||
                "Plan, assign and track project work from one focused board."}
            </p>

            <div className="mt-7 flex flex-wrap gap-5 text-xs text-slate-400">
              <span>Created {formatDate(project.createdAt)}</span>

              <span>Workspace: {workspace.name}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {canManageProject && (
              <button
                type="button"
                disabled={archived}
                onClick={() => {
                  setWorkflowEditorOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-4 w-4"
                >
                  <path d="M3 5h14M3 10h14M3 15h14" />

                  <circle cx="7" cy="5" r="1.5" fill="currentColor" />

                  <circle cx="13" cy="10" r="1.5" fill="currentColor" />

                  <circle cx="9" cy="15" r="1.5" fill="currentColor" />
                </svg>
                Manage workflow
              </button>
            )}

            <button
              type="button"
              disabled={archived}
              onClick={() => {
                setSuccessMessage(null);
                createTaskMutation.reset();

                setDialogState({
                  mode: "create",
                });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-slate-700 disabled:text-slate-400"
            >
              <span className="text-lg">+</span>

              {archived ? "Project archived" : "Create task"}
            </button>
          </div>
        </div>
      </div>

      {archived && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          This project is archived. You can view its tasks, but you must restore
          the project before creating or changing tasks.
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
        >
          <span>{successMessage}</span>

          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700"
          >
            ×
          </button>
        </div>
      )}

      {taskMutationError !== null && taskMutationError !== undefined && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700"
        >
          {getWorkspaceErrorMessage(taskMutationError)}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m13 13 4 4" />
          </svg>

          <input
            type="search"
            value={search}
            aria-label="Search tasks"
            placeholder="Search task titles..."
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
          />
        </div>

        <select
          aria-label="Filter tasks by priority"
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(event.target.value as TaskPriority | "all")
          }
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        >
          <option value="all">All priorities</option>

          {taskPriorities.map((priority) => (
            <option key={priority} value={priority}>
              {taskPriorityLabels[priority]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter tasks by assignee"
          value={assigneeFilter}
          onChange={(event) => setAssigneeFilter(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        >
          <option value="all">All assignees</option>

          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.user.firstName} {member.user.lastName}
            </option>
          ))}
        </select>

        {(search || priorityFilter !== "all" || assigneeFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setPriorityFilter("all");
              setAssigneeFilter("all");
            }}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      <TaskBoard
        columns={columnsQuery.data ?? []}
        tasksByColumn={tasksByColumn}
        projectKey={project.key}
        members={members}
        isArchived={archived}
        canDelete={canDelete}
        isUpdating={isMutating}
        onEdit={(selectedTask) => {
          updateTaskMutation.reset();

          setDialogState({
            mode: "edit",
            task: selectedTask,
          });
        }}
        onDelete={setTaskToDelete}
        onColumnChange={(selectedTask, columnId) => {
          void changeTaskColumn(selectedTask, columnId);
        }}
      />
      {(tasksQuery.data ?? []).length === 0 &&
        !search &&
        priorityFilter === "all" &&
        assigneeFilter === "all" && (
          <div className="mt-6 rounded-[28px] border border-dashed border-violet-200 bg-gradient-to-br from-white to-violet-50/50 p-12 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-emerald-100 text-2xl">
              ✓
            </span>

            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              Start planning this project
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Create the first task, assign it to a workspace member and move it
              through the workflow.
            </p>

            {!archived && (
              <button
                type="button"
                onClick={() =>
                  setDialogState({
                    mode: "create",
                  })
                }
                className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700"
              >
                Create first task
              </button>
            )}
          </div>
        )}

      {dialogState && (
        <TaskFormDialog
          key={
            dialogState.mode === "create" ? "create-task" : dialogState.task.id
          }
          task={dialogState.mode === "edit" ? dialogState.task : undefined}
          columns={columnsQuery.data ?? []}
          members={members}
          isPending={
            createTaskMutation.isPending || updateTaskMutation.isPending
          }
          error={
            dialogState.mode === "create"
              ? createTaskMutation.error
              : updateTaskMutation.error
          }
          onSubmit={submitTask}
          onClose={() => {
            if (!isMutating) {
              setDialogState(null);
            }
          }}
        />
      )}
      {isWorkflowEditorOpen && canManageProject && (
        <WorkflowEditorDialog
          workspaceId={workspaceId}
          projectId={projectId}
          columns={columnsQuery.data}
          tasks={tasksQuery.data ?? []}
          onClose={() => {
            setWorkflowEditorOpen(false);
          }}
        />
      )}
      <ConfirmationDialog
        isOpen={taskToDelete !== null}
        title="Delete this task?"
        description={
          taskToDelete
            ? `${project.key}-${taskToDelete.taskNumber} · ${taskToDelete.title} will be permanently deleted. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete task"
        tone="danger"
        isPending={deleteTaskMutation.isPending}
        onConfirm={() => void confirmDelete()}
        onClose={() => {
          if (!deleteTaskMutation.isPending) {
            setTaskToDelete(null);
          }
        }}
      />
    </section>
  );
}
