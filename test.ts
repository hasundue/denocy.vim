import { test } from "./mod.ts";

test("test interface", (vim) => {
  vim.should.exist();
});

test("test interface with an option", { target: "any" }, (vim) => {
  vim.should.exist();
});

test({
  name: "test interface with TestDefinition",
  target: "any",
  fn: (vim) => {
    vim.should.exist();
  },
});

test("Denocy (nvim)", { target: "nvim" }, (nvim) => {
  nvim.should.beNeovim();
});

test("Denocy (vim)", { target: "vim" }, (vim) => {
  vim.should.not.beNeovim();
});

test("Buffer", (vim) => {
  vim.buffer.should.exist();
  vim.buffer.should.beEmpty();
});

test("edit", (vim) => {
  vim.edit("./README.md");
  vim.buffer.should.not.beEmpty();
});

test("containing", (vim) => {
  vim.buffer.containing("denocy.vim").should.not.exist();
  vim.edit("./README.md");
  vim.buffer.containing("denocy.vim").should.exist();
  vim.buffer.containing("denocy is garbage").should.not.exist();
});

test("include", (vim) => {
  const buf = vim.buffer;
  buf.should.not.include("denocy.vim");
  vim.edit("./README.md");
  buf.should.include("denocy.vim");
});

test("onlyInclude", (vim) => {
  vim.edit("./README.md");
  vim.buffer.should.not.onlyInclude("denocy.vim");
});

test("Window", (vim) => {
  vim.window.should.exist();
  vim.window.containing("denocy.vim").should.not.exist();
  vim.edit("./README.md");
  vim.window.containing("denocy.vim").should.exist();
});
