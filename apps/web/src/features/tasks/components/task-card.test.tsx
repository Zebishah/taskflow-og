import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ProjectColumn } from "../../project-columns/project-column.types";
import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import type { Task } from "../task.types";
import { TaskCard } from "./task-card";

const member: WorkspaceMember = {
  id: "97da5511-d500-4d53-9c98-b91c22a41f3e",
  workspaceId: "6eea0d06-9ebb-492b-820c-6f08638e5eef",
  userId: "86e9d8bf-cfca-46a9-a389-1712f49f7c51",
  role: "member",
  joinedAt: "2026-07-23T10:00:00.000Z",
  createdAt: "2026-07-23T10:00:00.000Z",
  updatedAt: "2026-07-23T10:00:00.000Z",

  user: {
    id: "86e9d8bf-cfca-46a9-a389-1712f49f7c51",
    email: "member@example.com",
    firstName: "Task",
    lastName: "Member",
    status: "active",
  },
};

const todoColumnId = "2882f1dc-8f67-419c-87b5-d2729574a25a";
const inProgressColumnId = "10fc6b5a-61c6-47ce-a805-679b897a6f09";

const columns: ProjectColumn[] = [
  {
    id: todoColumnId,
    projectId: "da135c51-3f2e-4b59-b737-fc92a0e650b5",
    name: "To do",
    color: "blue",
    kind: "backlog",
    position: 1000,
    createdAt: "2026-07-23T10:00:00.000Z",
    updatedAt: "2026-07-23T10:00:00.000Z",
  },
  {
    id: inProgressColumnId,
    projectId: "da135c51-3f2e-4b59-b737-fc92a0e650b5",
    name: "In progress",
    color: "violet",
    kind: "active",
    position: 2000,
    createdAt: "2026-07-23T10:00:00.000Z",
    updatedAt: "2026-07-23T10:00:00.000Z",
  },
];

const task: Task = {
  id: "15ca922e-d80f-47dd-83e6-d9f5393b398e",
  workspaceId: "6eea0d06-9ebb-492b-820c-6f08638e5eef",
  projectId: "da135c51-3f2e-4b59-b737-fc92a0e650b5",
  columnId: todoColumnId,
  createdByUserId: "2e01067b-0ae0-431c-8833-d7b2d77518f0",
  assigneeMemberId: member.id,
  taskNumber: 7,
  title: "Build dashboard",
  description: "Create the analytics dashboard",
  priority: "urgent",
  position: 7000,
  dueAt: null,
  completedAt: null,
  imageKey: null,
  imageOriginalName: null,
  imageContentType: null,
  imageSizeBytes: null,
  createdAt: "2026-07-23T10:00:00.000Z",
  updatedAt: "2026-07-23T10:00:00.000Z",
};

interface RenderTaskCardOptions {
  canDelete?: boolean;
  isArchived?: boolean;
}

function renderTaskCard(options: RenderTaskCardOptions = {}) {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onColumnChange = vi.fn();

  render(
    <TaskCard
      projectKey="WEB"
      task={task}
      columns={columns}
      assignee={member}
      isArchived={options.isArchived ?? false}
      canDelete={options.canDelete ?? true}
      isUpdating={false}
      onEdit={onEdit}
      onDelete={onDelete}
      onColumnChange={onColumnChange}
    />,
  );

  return {
    onEdit,
    onDelete,
    onColumnChange,
  };
}

async function openActionsMenu(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.click(screen.getByLabelText(`Actions for ${task.title}`));
}

describe("TaskCard", () => {
  it("shows the task identifier and task information", () => {
    renderTaskCard();

    expect(screen.getByText("WEB-7")).toBeInTheDocument();
    expect(screen.getByText("Build dashboard")).toBeInTheDocument();
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("Task Member")).toBeInTheDocument();
  });

  it("calls onEdit from the actions menu", async () => {
    const user = userEvent.setup();
    const { onEdit } = renderTaskCard();

    await openActionsMenu(user);
    await user.click(screen.getByRole("button", { name: "Edit task" }));

    expect(onEdit).toHaveBeenCalledWith(task);
  });

  it("moves a task to another project column", async () => {
    const user = userEvent.setup();
    const { onColumnChange } = renderTaskCard();

    await openActionsMenu(user);
    await user.click(screen.getByRole("button", { name: "In progress" }));

    expect(onColumnChange).toHaveBeenCalledWith(task, inProgressColumnId);
  });

  it("shows delete for owners and administrators", async () => {
    const user = userEvent.setup();

    renderTaskCard({ canDelete: true });
    await openActionsMenu(user);

    expect(
      screen.getByRole("button", { name: "Delete task" }),
    ).toBeInTheDocument();
  });

  it("hides delete from ordinary members", async () => {
    const user = userEvent.setup();

    renderTaskCard({ canDelete: false });
    await openActionsMenu(user);

    expect(
      screen.queryByRole("button", { name: "Delete task" }),
    ).not.toBeInTheDocument();
  });

  it("disables editing and hides movement for archived projects", async () => {
    const user = userEvent.setup();

    renderTaskCard({ isArchived: true });
    await openActionsMenu(user);

    expect(screen.getByRole("button", { name: "Edit task" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "In progress" }),
    ).not.toBeInTheDocument();
  });

  it("calls onDelete from the actions menu", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderTaskCard();

    await openActionsMenu(user);
    await user.click(screen.getByRole("button", { name: "Delete task" }));

    expect(onDelete).toHaveBeenCalledWith(task);
  });
});
