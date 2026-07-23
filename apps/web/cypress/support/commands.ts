import type { E2eUser } from "./test-data";

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };

  accessToken: string;
}

function getApiUrl(): string {
  const apiUrl: unknown = Cypress.expose("apiUrl");

  if (typeof apiUrl !== "string" || apiUrl.length === 0) {
    throw new Error("Cypress apiUrl is missing");
  }

  return apiUrl.replace(/\/+$/, "");
}
Cypress.Commands.add("findFormField", (label: string) => {
  return cy
    .contains("label", label)
    .invoke("attr", "for")
    .then((fieldId) => {
      if (!fieldId) {
        throw new Error(`The "${label}" label has no for attribute`);
      }

      return cy.get<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `[id="${fieldId}"]`,
      );
    });
});

Cypress.Commands.add("registerUserByApi", (user: E2eUser): void => {
  cy.request<AuthResponse>({
    method: "POST",
    url: `${getApiUrl()}/auth/register`,
    body: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
    },
    failOnStatusCode: true,
  }).then(() => undefined);
});

Cypress.Commands.add(
  "loginByApi",
  (user: Pick<E2eUser, "email" | "password">): void => {
    cy.request<AuthResponse>({
      method: "POST",
      url: `${getApiUrl()}/auth/login`,
      body: {
        email: user.email,
        password: user.password,
      },
      failOnStatusCode: true,
    }).then(() => undefined);
  },
);

Cypress.Commands.add("loginWithSession", (user: E2eUser): void => {
  cy.session(
    [user.email, user.password],
    () => {
      cy.loginByApi(user);
    },
    {
      validate() {
        cy.request({
          method: "POST",
          url: `${getApiUrl()}/auth/refresh`,
          failOnStatusCode: true,
        })
          .its("status")
          .should("equal", 200);
      },
    },
  );
});
