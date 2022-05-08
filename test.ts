import { test } from "./mod.ts";
import { popup } from "./deps.ts";

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

test("Popup", { target: "all" }, (vim) => {
  vim.popup.should.not.exist();
  vim.edit("README.md");
  vim.register(async denops => {
    await popup.open(denops, 1, {
      row: 1,
      col: 1,
      width: 1,
      height: 1,
    });
  });
  vim.popup.should.exist();
  vim.popup.should.not.beEmpty();
  vim.popup.should.include("denocy.vim");
  vim.popup.containing("denocy.vim").should.exist();
});
