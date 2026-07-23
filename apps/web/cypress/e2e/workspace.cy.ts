import { createE2eUser, createE2eWorkspace } from "../support/test-data";

describe("Workspace management", () => {
  it("creates a workspace and keeps it available after reload", () => {
    const user = createE2eUser("workspace-owner");

    const workspace = createE2eWorkspace();

    cy.registerUserByApi(user);

    cy.visit("/workspaces/new");

    cy.findFormField("Workspace name").clear().type(workspace.name);

    /*
     * Workspace slug is generated automatically,
     * but explicitly setting it makes this test
     * deterministic.
     */
    cy.findFormField("Workspace URL").clear().type(workspace.slug);

    cy.findFormField("Description").type(workspace.description);

    cy.intercept("POST", "**/api/v1/workspaces").as("createWorkspace");

    cy.contains("button", "Create workspace").click();

    cy.wait("@createWorkspace")
      .its("response.statusCode")
      .should("be.oneOf", [200, 201]);

    cy.location("pathname").should("match", /^\/workspaces\/[0-9a-f-]+$/);

    cy.contains(workspace.name).should("be.visible");

    cy.contains("Owner").should("be.visible");

    cy.reload();

    cy.contains(workspace.name).should("be.visible");

    cy.contains("Manage projects").should("be.visible");
  });
});
