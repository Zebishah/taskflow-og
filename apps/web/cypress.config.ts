import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  expose: {
    apiUrl: "http://localhost:3000/api/v1",
  },

  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    testIsolation: true,
  },

  viewportWidth: 1440,
  viewportHeight: 1000,
  screenshotOnRunFailure: true,
  video: true,
});
