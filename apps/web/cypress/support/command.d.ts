/* eslint-disable @typescript-eslint/no-namespace */

import type { E2eUser } from "./test-data";

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Finds an input, textarea, or select using its visible label.
       */
      findFormField(
        label: string,
      ): Chainable<
        JQuery<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      >;

      /**
       * Registers a user directly through the API.
       */
      registerUserByApi(user: E2eUser): Chainable<void>;

      /**
       * Logs in directly through the API.
       */
      loginByApi(user: Pick<E2eUser, "email" | "password">): Chainable<void>;

      /**
       * Creates and caches an authenticated Cypress session.
       */
      loginWithSession(user: E2eUser): Chainable<void>;
    }
  }
}

export {};
