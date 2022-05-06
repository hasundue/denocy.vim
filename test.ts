import { Denocy } from "./mod.ts";

Denocy.test("test interface", (vim) => {
  vim.should.exist();
});

Denocy.test("test interface with an option", { target: "any" }, (vim) => {
  vim.should.exist();
});

Denocy.test({
  name: "test interface with TestDefinition",
  target: "any",
  fn: (vim) => {
    vim.should.exist();
  },
});

Denocy.test("Denocy (nvim)", { target: "nvim" }, (nvim) => {
  nvim.should.beNeovim();
});

Denocy.test("Denocy (vim)", { target: "vim" }, (vim) => {
  vim.should.not.beNeovim();
});

Denocy.test("BufferProvider", (vim) => {
  vim.buffer.should.exist();
  vim.buffer.should.beEmpty();
});

Denocy.test("edit", (vim) => {
  vim.edit("./README.md");
  vim.buffer.should.not.beEmpty();
});

Denocy.test("containing", (vim) => {
  vim.edit("./README.md");
  vim.buffer.containing("denocy.vim").should.exist();
  vim.buffer.containing("denocy is garbage").should.not.exist();
});

Denocy.test("include", (vim) => {
  const buf = vim.buffer;

  buf.should.not.include("denocy.vim");

  vim.edit("./README.md");
  buf.should.include("denocy.vim");
});

Denocy.test("onlyInclude", (vim) => {
  vim.edit("./README.md");
  vim.buffer.should.not.onlyInclude("denocy.vim");
});
