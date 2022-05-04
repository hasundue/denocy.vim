import * as Denocy from "./mod.ts";

Denocy.test("Test basic interfaces of Denocy", (cy) => {
  cy.should.exist();
});

Denocy.test("Test basic interfaces of Denocy with an option", { target: "all" }, (cy) => {
  cy.should.exist();
});

Denocy.test({
  name: "Test basic interfaces of Denocy with TestDefinition",
  target: "all",
  fn: (cy) => {
    cy.should.exist();
  },
});
