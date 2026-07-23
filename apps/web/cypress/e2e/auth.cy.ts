import { createE2eUser } from "../support/test-data";

describe("Authentication", () => {
  it("registers a user and restores the session after reload", () => {
    const user = createE2eUser("registration");

    cy.intercept("POST", "**/api/v1/auth/register").as("registerRequest");

    cy.visit("/register");

    cy.findFormField("First name").type(user.firstName);
    cy.findFormField("Last name").type(user.lastName);
    cy.findFormField("Email address").type(user.email);
    cy.findFormField("Password").type(user.password, {
      log: false,
    });
    cy.findFormField("Confirm password").type(user.password, {
      log: false,
    });

    cy.contains("button", "Create account").click();

    cy.wait("@registerRequest")
      .its("response.statusCode")
      .should("be.oneOf", [200, 201]);

    cy.location("pathname", {
      timeout: 15_000,
    }).should("equal", "/dashboard");

    cy.contains(user.firstName).should("be.visible");

    cy.reload();

    cy.contains("Restoring your session...").should("not.exist");

    cy.location("pathname", {
      timeout: 15_000,
    }).should("equal", "/dashboard");

    cy.contains(user.firstName).should("be.visible");
  });

  it("logs an authenticated user out", () => {
    const user = createE2eUser("logout");

    cy.registerUserByApi(user);

    cy.visit("/dashboard");

    cy.location("pathname", {
      timeout: 15_000,
    }).should("equal", "/dashboard");

    cy.contains("Restoring your session...").should("not.exist");

    cy.contains("button", "Sign out", {
      timeout: 15_000,
    })
      .should("be.visible")
      .click();

    cy.get('[role="alertdialog"]').should("be.visible");

    cy.get('[role="alertdialog"]')
      .contains("button", /sign out/i)
      .click();

    cy.location("pathname", {
      timeout: 15_000,
    }).should("equal", "/login");
  });
});
