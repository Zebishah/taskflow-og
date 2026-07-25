import { useDroppable } from "@dnd-kit/core";

import type {
  ProjectColumn,
  ProjectColumnColor,
} from "../../project-columns/project-column.types";
import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import type { Task } from "../task.types";
import { DraggableTaskCard } from "./draggable-task-card";

interface TaskColumnProps {
  column: ProjectColumn;
  columns: ProjectColumn[];
  tasks: Task[];
  projectKey: string;
  members: WorkspaceMember[];
  isArchived: boolean;
  canDelete: boolean;
  isUpdating: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onColumnChange: (task: Task, columnId: string) => void;
}

interface ColumnStyle {
  dot: string;
  background: string;
  border: string;
  overBackground: string;
  overBorder: string;
}

const columnStyles: Record<ProjectColumnColor, ColumnStyle> = {
  slate: {
    dot: "bg-slate-400",
    background: "from-slate-50 to-slate-100/70",
    border: "border-slate-200",
    overBackground: "bg-slate-100",
    overBorder: "border-slate-400",
  },

  blue: {
    dot: "bg-blue-500",
    background: "from-blue-50/80 to-slate-100/70",
    border: "border-blue-100",
    overBackground: "bg-blue-50",
    overBorder: "border-blue-400",
  },

  violet: {
    dot: "bg-violet-500",
    background: "from-violet-50/80 to-slate-100/70",
    border: "border-violet-100",
    overBackground: "bg-violet-50",
    overBorder: "border-violet-400",
  },

  amber: {
    dot: "bg-amber-500",
    background: "from-amber-50/80 to-slate-100/70",
    border: "border-amber-100",
    overBackground: "bg-amber-50",
    overBorder: "border-amber-400",
  },

  emerald: {
    dot: "bg-emerald-500",
    background: "from-emerald-50/80 to-slate-100/70",
    border: "border-emerald-100",
    overBackground: "bg-emerald-50",
    overBorder: "border-emerald-400",
  },

  rose: {
    dot: "bg-rose-500",
    background: "from-rose-50/80 to-slate-100/70",
    border: "border-rose-100",
    overBackground: "bg-rose-50",
    overBorder: "border-rose-400",
  },

  cyan: {
    dot: "bg-cyan-500",
    background: "from-cyan-50/80 to-slate-100/70",
    border: "border-cyan-100",
    overBackground: "bg-cyan-50",
    overBorder: "border-cyan-400",
  },

  indigo: {
    dot: "bg-indigo-500",
    background: "from-indigo-50/80 to-slate-100/70",
    border: "border-indigo-100",
    overBackground: "bg-indigo-50",
    overBorder: "border-indigo-400",
  },
};

export function TaskColumn({
  column,
  columns,
  tasks,
  projectKey,
  members,
  isArchived,
  canDelete,
  isUpdating,
  onEdit,
  onDelete,
  onColumnChange,
}: TaskColumnProps): React.JSX.Element {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${column.id}`,

    data: {
      type: "column",
      columnId: column.id,
    } satisfies {
      type: "column";
      columnId: string;
    },

    disabled: isArchived || isUpdating,
  });

  const style = columnStyles[column.color];

  return (
    <section
      ref={setNodeRef}
      aria-label={`${column.name} column`}
      className={[
        "flex min-h-[280px] flex-col rounded-[26px] border bg-gradient-to-b p-3 transition-all duration-200",
        style.background,
        isOver
          ? [
              style.overBorder,
              style.overBackground,
              "scale-[1.01] shadow-lg",
            ].join(" ")
          : style.border,
      ].join(" ")}
    >
      <header className="flex items-center justify-between gap-3 px-2 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className={[
                "h-2.5 w-2.5 shrink-0 rounded-full shadow-sm",
                style.dot,
              ].join(" ")}
            />

            <h2 className="truncate text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-700">
              {column.name}
            </h2>
          </div>

          <p className="mt-1 pl-5 text-[10px] font-medium text-slate-400">
            {column.kind === "done"
              ? "Completes tasks"
              : column.kind === "backlog"
                ? "Unplanned work"
                : "Active work"}
          </p>
        </div>

        <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white px-2 text-[10px] font-bold text-slate-500 shadow-sm">
          {tasks.length}
        </span>
      </header>

      <div className="mt-1 flex-1 space-y-3">
        {tasks.map((task) => {
          const assignee = members.find(
            (member) => member.id === task.assigneeMemberId,
          );

          return (
            <DraggableTaskCard
              key={task.id}
              projectKey={projectKey}
              task={task}
              columns={columns}
              assignee={assignee}
              isArchived={isArchived}
              canDelete={canDelete}
              isUpdating={isUpdating}
              onEdit={onEdit}
              onDelete={onDelete}
              onColumnChange={onColumnChange}
            />
          );
        })}

        {tasks.length === 0 && (
          <div
            className={[
              "flex min-h-36 items-center justify-center rounded-[22px] border-2 border-dashed px-5 text-center transition-all",
              isOver
                ? [
                    style.overBorder,
                    style.overBackground,
                    "text-slate-700",
                  ].join(" ")
                : "border-slate-200 bg-white/45 text-slate-400",
            ].join(" ")}
          >
            <div>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="mx-auto h-6 w-6"
              >
                <path d="M12 4v16M4 12h16" />
              </svg>

              <p className="mt-2 text-xs font-semibold">Drop tasks here</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
