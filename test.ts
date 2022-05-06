import { Denocy } from "./mod.ts";

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

Denocy.test("test should.beNeovim for nvim", { target: "nvim" }, (nvim) => {
  nvim.should.beNeovim();
});

Denocy.test("test should.not.beNeovim for vim", { target: "vim" }, (vim) => {
  vim.should.not.beNeovim();
});

Denocy.test("test BufferProvider", (vim) => {
  vim.buffer.should.exist();
  vim.buffer.should.beEmpty();
});

Denocy.test("test edit", (vim) => {
  vim.edit("./README.md");
  vim.should.not.beEmpty();
  vim.buffer.should.not.beEmpty();
});

Denocy.test("test containing", (vim) => {
  vim.edit("./README.md");
  vim.buffer.containing("denocy.vim").should.exist();
  vim.buffer.containing("denocy is the worst").should.not.exist();
});
