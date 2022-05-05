import * as Denocy from "./mod.ts";

Denocy.test("test basic interfaces of Denocy", (vim) => {
  vim.should.exist();
});

Denocy.test("test basic interfaces of Denocy with an option", { target: "any" }, (vim) => {
  vim.should.exist();
});

Denocy.test({
  name: "test basic interfaces of Denocy with TestDefinition",
  target: "any",
  fn: (vim) => {
    vim.should.exist();
  },
});

Denocy.test("test should.beNvim for nvim", { target: "nvim" }, (vim) => {
  vim.should.beNvim();
});

Denocy.test("test should.not.beNvim for vim", { target: "vim" }, (vim) => {
  vim.should.not.beNvim();
});
