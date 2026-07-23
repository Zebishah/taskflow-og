import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import type { Task, TaskFormValues } from "../task.types";
import { TaskFormDialog } from "./task-form-dialog";

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

const existingTask: Task = {
  id: "15ca922e-d80f-47dd-83e6-d9f5393b398e",
  workspaceId: "6eea0d06-9ebb-492b-820c-6f08638e5eef",
  projectId: "da135c51-3f2e-4b59-b737-fc92a0e650b5",
  createdByUserId: "2e01067b-0ae0-431c-8833-d7b2d77518f0",
  assigneeMemberId: member.id,
  taskNumber: 1,
  title: "Build login page",
  description: "Create the authentication UI",
  status: "in_progress",
  priority: "high",
  position: 1000,
  dueAt: "2026-08-15T18:59:59.999Z",
  completedAt: null,
  createdAt: "2026-07-23T10:00:00.000Z",
  updatedAt: "2026-07-23T10:00:00.000Z",
};

function createSubmitMock() {
  return vi.fn(async (_values: TaskFormValues): Promise<void> => {
    await Promise.resolve();
    console.log("Mock submit called with values:", _values);
  });
}

describe("TaskFormDialog", () => {
  it("shows validation when the title is missing", async () => {
    const user = userEvent.setup();
    const onSubmit = createSubmitMock();

    render(
      <TaskFormDialog
        members={[member]}
        isPending={false}
        error={null}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Create task",
      }),
    );

    expect(
      screen.getByText("Title must contain at least 2 characters."),
    ).toBeInTheDocument();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits normalized task values", async () => {
    const user = userEvent.setup();
    const onSubmit = createSubmitMock();

    render(
      <TaskFormDialog
        members={[member]}
        isPending={false}
        error={null}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Task title"), "  Build dashboard  ");

    await user.type(
      screen.getByRole("textbox", {
        name: "Description",
      }),
      "  Build the analytics dashboard  ",
    );

    await user.selectOptions(screen.getByLabelText("Status"), "in_progress");

    await user.selectOptions(screen.getByLabelText("Priority"), "high");

    await user.selectOptions(screen.getByLabelText("Assignee"), member.id);

    fireEvent.change(screen.getByLabelText(/Due date/i), {
      target: {
        value: "2026-08-15",
      },
    });

    await user.click(
      screen.getByRole("button", {
        name: "Create task",
      }),
    );

    const expectedDueAt = new Date("2026-08-15T23:59:59.999").toISOString();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "Build dashboard",
        description: "Build the analytics dashboard",
        status: "in_progress",
        priority: "high",
        assigneeMemberId: member.id,
        dueAt: expectedDueAt,
      });
    });
  });

  it("populates fields when editing a task", () => {
    render(
      <TaskFormDialog
        task={existingTask}
        members={[member]}
        isPending={false}
        error={null}
        onSubmit={createSubmitMock()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Edit task",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Task title")).toHaveValue("Build login page");

    expect(
      screen.getByRole("textbox", {
        name: "Description",
      }),
    ).toHaveTextContent("Create the authentication UI");

    expect(screen.getByLabelText("Status")).toHaveValue("in_progress");

    expect(screen.getByLabelText("Priority")).toHaveValue("high");

    expect(screen.getByLabelText("Assignee")).toHaveValue(member.id);

    expect(screen.getByLabelText(/Due date/i)).toHaveValue("2026-08-15");
  });

  it("renders API errors as text", () => {
    render(
      <TaskFormDialog
        members={[]}
        isPending={false}
        error={new Error("The project is archived")}
        onSubmit={createSubmitMock()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The project is archived",
    );
  });

  it("disables form actions while saving", () => {
    render(
      <TaskFormDialog
        members={[]}
        isPending
        error={null}
        onSubmit={createSubmitMock()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Saving...",
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Cancel",
      }),
    ).toBeDisabled();
  });
});
