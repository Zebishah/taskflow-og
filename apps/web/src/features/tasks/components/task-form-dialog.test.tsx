import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProjectColumn } from "../../project-columns/project-column.types";
import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import type { Task, TaskFormValues } from "../task.types";
import { TaskFormDialog } from "./task-form-dialog";

const workspaceId = "6eea0d06-9ebb-492b-820c-6f08638e5eef";

const projectId = "da135c51-3f2e-4b59-b737-fc92a0e650b5";

const todoColumn: ProjectColumn = {
  id: "11111111-1111-4111-8111-111111111111",
  projectId,
  name: "To do",
  color: "blue",
  kind: "active",
  position: 1_000,
  createdAt: "2026-07-23T10:00:00.000Z",
  updatedAt: "2026-07-23T10:00:00.000Z",
};

const inProgressColumn: ProjectColumn = {
  id: "22222222-2222-4222-8222-222222222222",
  projectId,
  name: "In progress",
  color: "violet",
  kind: "active",
  position: 2_000,
  createdAt: "2026-07-23T10:00:00.000Z",
  updatedAt: "2026-07-23T10:00:00.000Z",
};

const doneColumn: ProjectColumn = {
  id: "33333333-3333-4333-8333-333333333333",
  projectId,
  name: "Done",
  color: "emerald",
  kind: "done",
  position: 3_000,
  createdAt: "2026-07-23T10:00:00.000Z",
  updatedAt: "2026-07-23T10:00:00.000Z",
};

const columns: ProjectColumn[] = [todoColumn, inProgressColumn, doneColumn];

const member: WorkspaceMember = {
  id: "97da5511-d500-4d53-9c98-b91c22a41f3e",
  workspaceId,
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
  workspaceId,
  projectId,
  columnId: inProgressColumn.id,
  createdByUserId: "2e01067b-0ae0-431c-8833-d7b2d77518f0",
  assigneeMemberId: member.id,
  taskNumber: 1,
  title: "Build login page",
  description: "Create the authentication UI",
  priority: "high",
  position: 1_000,
  dueAt: "2026-08-15T18:59:59.999Z",
  completedAt: null,
  createdAt: "2026-07-23T10:00:00.000Z",
  updatedAt: "2026-07-23T10:00:00.000Z",
};

function createSubmitMock() {
  return vi.fn((_values: TaskFormValues): Promise<void> => Promise.resolve());
}

describe("TaskFormDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the combined date and time picker", async () => {
    const user = userEvent.setup();

    class ResizeObserverMock {
      public disconnect = vi.fn();

      public observe = vi.fn();

      public unobserve = vi.fn();
    }

    vi.stubGlobal("ResizeObserver", ResizeObserverMock);

    render(
      <TaskFormDialog
        columns={columns}
        members={[]}
        isPending={false}
        error={null}
        onSubmit={createSubmitMock()}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText("Due date and time"));

    expect(document.querySelector(".react-datepicker")).toBeInTheDocument();

    expect(
      document.querySelector(".react-datepicker__time-container"),
    ).toBeInTheDocument();
  });

  it("shows validation when the title is missing", async () => {
    const user = userEvent.setup();

    const onSubmit = createSubmitMock();

    render(
      <TaskFormDialog
        columns={columns}
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

  it("submits normalized task values with a column ID", async () => {
    const user = userEvent.setup();

    const onSubmit = createSubmitMock();

    render(
      <TaskFormDialog
        columns={columns}
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

    await user.selectOptions(
      screen.getByLabelText("Column"),
      inProgressColumn.id,
    );

    await user.selectOptions(screen.getByLabelText("Priority"), "high");

    await user.selectOptions(screen.getByLabelText("Assignee"), member.id);

    await user.click(
      screen.getByRole("button", {
        name: "Create task",
      }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "Build dashboard",
        description: "Build the analytics dashboard",
        columnId: inProgressColumn.id,
        priority: "high",
        assigneeMemberId: member.id,
        dueAt: null,
      });
    });
  });

  it("uses the first active column by default", () => {
    render(
      <TaskFormDialog
        columns={columns}
        members={[]}
        isPending={false}
        error={null}
        onSubmit={createSubmitMock()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Column")).toHaveValue(todoColumn.id);
  });

  it("populates fields when editing a task", () => {
    render(
      <TaskFormDialog
        task={existingTask}
        columns={columns}
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

    expect(screen.getByLabelText("Column")).toHaveValue(inProgressColumn.id);

    expect(screen.getByLabelText("Priority")).toHaveValue("high");

    expect(screen.getByLabelText("Assignee")).toHaveValue(member.id);

    /*
     * Do not assert a fixed displayed time because
     * React DatePicker uses the test machine's local
     * timezone.
     */
    expect(screen.getByLabelText("Due date and time")).not.toHaveValue("");
  });

  it("renders API errors as text", () => {
    render(
      <TaskFormDialog
        columns={columns}
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
        columns={columns}
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

  it("prevents submission when no columns exist", () => {
    render(
      <TaskFormDialog
        columns={[]}
        members={[]}
        isPending={false}
        error={null}
        onSubmit={createSubmitMock()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Create task",
      }),
    ).toBeDisabled();

    expect(screen.getByLabelText("Column")).toHaveValue("");
  });
});
