import {
  createE2eProject,
  createE2eTask,
  createE2eUser,
  createE2eWorkspace,
} from "../support/test-data";

describe("Project task management", () => {
  it("creates, edits, completes and deletes a task", () => {
    const user = createE2eUser("task-owner");

    const workspace = createE2eWorkspace();

    const project = createE2eProject();

    const task = createE2eTask();

    /*
     * Registering through the real API is setup.
     * The refresh cookie authenticates the browser
     * when it visits the React application.
     */
    cy.registerUserByApi(user);

    /*
     * Create workspace through the real UI.
     */
    cy.visit("/workspaces/new");

    cy.findFormField("Workspace name").clear().type(workspace.name);

    cy.findFormField("Workspace URL").clear().type(workspace.slug);

    cy.findFormField("Description").type(workspace.description);

    cy.intercept("POST", "**/api/v1/workspaces").as("createWorkspace");

    cy.contains("button", "Create workspace").click();

    cy.wait("@createWorkspace");

    cy.location("pathname").should("match", /^\/workspaces\/[0-9a-f-]+$/);

    /*
     * Navigate to projects.
     */
    cy.contains("Manage projects").click();

    cy.location("pathname").should(
      "match",
      /^\/workspaces\/[0-9a-f-]+\/projects$/,
    );

    /*
     * Create project.
     */
    cy.contains("button", /Create (first )?project/i).click();

    cy.get('[role="dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#project-name").clear().type(project.name);

        cy.get("#project-key").clear().type(project.key);

        cy.get("#project-description").clear().type(project.description);

        cy.intercept("POST", "**/api/v1/workspaces/*/projects").as(
          "createProject",
        );

        cy.contains("button", "Create project").click();
      });

    cy.wait("@createProject")
      .its("response.statusCode")
      .should("be.oneOf", [200, 201]);

    cy.contains(project.name).should("be.visible");

    /*
     * Open the project's task board.
     */
    cy.contains("article", project.name).contains("Open project").click();

    cy.location("pathname").should(
      "match",
      /^\/workspaces\/[0-9a-f-]+\/projects\/[0-9a-f-]+$/,
    );

    cy.contains("h1", project.name).should("be.visible");

    /*
     * Create task.
     */
    cy.contains("button", /^Create task$/).click();

    cy.get('[role="dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#task-title").clear().type(task.title);

        cy.get("#task-priority").select("high");

        cy.get("#task-status").select("todo");

        cy.intercept("POST", "**/api/v1/workspaces/*/projects/*/tasks").as(
          "createTask",
        );

        cy.contains("button", "Create task").click();
      });

    cy.wait("@createTask")
      .its("response.statusCode")
      .should("be.oneOf", [200, 201]);

    cy.contains(task.title).should("be.visible");

    /*
     * Edit task title.
     */
    cy.contains("article", task.title).contains("button", "Edit").click();

    cy.get('[role="dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#task-title").clear().type(task.updatedTitle);

        cy.intercept("PATCH", "**/api/v1/workspaces/*/projects/*/tasks/*").as(
          "updateTask",
        );

        cy.contains("button", "Save changes").click();
      });

    cy.wait("@updateTask").its("response.statusCode").should("equal", 200);

    cy.contains(task.updatedTitle).should("be.visible");

    cy.contains(task.title).should("not.exist");

    /*
     * Move task to Done.
     */
    cy.intercept("PATCH", "**/api/v1/workspaces/*/projects/*/tasks/*").as(
      "completeTask",
    );

    cy.get(`[aria-label="Status for ${task.updatedTitle}"]`).select("done");

    cy.wait("@completeTask").its("response.statusCode").should("equal", 200);

    /*
     * Verify it appears in the Done column.
     */
    cy.contains("h2", "Done")
      .parents("section")
      .first()
      .within(() => {
        cy.contains(task.updatedTitle).should("be.visible");
      });

    /*
     * Reload proves persistence in PostgreSQL.
     */
    cy.reload();

    cy.contains("h2", "Done")
      .parents("section")
      .first()
      .within(() => {
        cy.contains(task.updatedTitle).should("be.visible");
      });

    /*
     * Delete task using the confirmation dialog.
     */
    cy.contains("article", task.updatedTitle)
      .contains("button", "Delete")
      .click();

    cy.get('[role="alertdialog"]')
      .should("be.visible")
      .within(() => {
        cy.contains("Delete this task?").should("be.visible");

        cy.intercept("DELETE", "**/api/v1/workspaces/*/projects/*/tasks/*").as(
          "deleteTask",
        );

        cy.contains("button", "Delete task").click();
      });

    cy.wait("@deleteTask").its("response.statusCode").should("equal", 204);

    cy.contains(task.updatedTitle).should("not.exist");

    cy.reload();

    cy.contains(task.updatedTitle).should("not.exist");
  });
});
