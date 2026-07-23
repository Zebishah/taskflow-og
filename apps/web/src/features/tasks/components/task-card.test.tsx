import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

const task: Task = {
  id: "15ca922e-d80f-47dd-83e6-d9f5393b398e",
  workspaceId: "6eea0d06-9ebb-492b-820c-6f08638e5eef",
  projectId: "da135c51-3f2e-4b59-b737-fc92a0e650b5",
  createdByUserId: "2e01067b-0ae0-431c-8833-d7b2d77518f0",
  assigneeMemberId: member.id,
  taskNumber: 7,
  title: "Build dashboard",
  description: "Create the analytics dashboard",
  status: "todo",
  priority: "urgent",
  position: 7000,
  dueAt: null,
  completedAt: null,
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
  const onStatusChange = vi.fn();

  render(
    <TaskCard
      projectKey="WEB"
      task={task}
      assignee={member}
      isArchived={options.isArchived ?? false}
      canDelete={options.canDelete ?? true}
      isUpdating={false}
      onEdit={onEdit}
      onDelete={onDelete}
      onStatusChange={onStatusChange}
    />,
  );

  return {
    onEdit,
    onDelete,
    onStatusChange,
  };
}

describe("TaskCard", () => {
  it("shows the task identifier and task information", () => {
    renderTaskCard();

    expect(screen.getByText("WEB-7")).toBeInTheDocument();

    expect(screen.getByText("Build dashboard")).toBeInTheDocument();

    expect(screen.getByText("Urgent")).toBeInTheDocument();

    expect(screen.getByText("Task")).toBeInTheDocument();
  });

  it("calls onEdit when Edit is clicked", async () => {
    const user = userEvent.setup();

    const { onEdit } = renderTaskCard();

    await user.click(
      screen.getByRole("button", {
        name: "Edit",
      }),
    );

    expect(onEdit).toHaveBeenCalledWith(task);
  });

  it("changes task status", async () => {
    const user = userEvent.setup();

    const { onStatusChange } = renderTaskCard();

    await user.selectOptions(
      screen.getByLabelText("Status for Build dashboard"),
      "in_progress",
    );

    expect(onStatusChange).toHaveBeenCalledWith(task, "in_progress");
  });

  it("shows delete for owners and administrators", () => {
    renderTaskCard({
      canDelete: true,
    });

    expect(
      screen.getByRole("button", {
        name: "Delete",
      }),
    ).toBeInTheDocument();
  });

  it("hides delete from ordinary members", () => {
    renderTaskCard({
      canDelete: false,
    });

    expect(
      screen.queryByRole("button", {
        name: "Delete",
      }),
    ).not.toBeInTheDocument();
  });

  it("disables editing and movement for archived projects", () => {
    renderTaskCard({
      isArchived: true,
    });

    expect(
      screen.getByRole("button", {
        name: "Edit",
      }),
    ).toBeDisabled();

    expect(screen.getByLabelText("Status for Build dashboard")).toBeDisabled();
  });

  it("calls onDelete when Delete is clicked", async () => {
    const user = userEvent.setup();

    const { onDelete } = renderTaskCard();

    await user.click(
      screen.getByRole("button", {
        name: "Delete",
      }),
    );

    expect(onDelete).toHaveBeenCalledWith(task);
  });
});
