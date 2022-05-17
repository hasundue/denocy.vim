import { test } from "./mod.ts";
import { popup, assertLike, assertEquals } from "./deps.ts";

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

test("cmd", (vim) => {
  vim.buffer.should.beEmpty();
  vim.cmd("call setbufline('', 1, 'denocy.vim')");
  vim.buffer.should.onlyInclude("denocy.vim");
});

test("call", (vim) => {
  vim.buffer.should.beEmpty();
  vim.call("setbufline", "", 1, "denocy.vim");
  vim.buffer.should.onlyInclude("denocy.vim");
});

test("batch", (vim) => {
  vim.buffer.should.beEmpty();
  vim.batch(
    ["setbufline", "", 1, "denocy.vim"],
    ["setbufline", "", 2, "it's great"],
  );
  vim.buffer.should.not.beEmpty();
  vim.buffer.should.not.onlyInclude("denocy.vim");
});

test("moveTo", (vim) => {
  vim.edit("README.md");
  vim.moveTo("denocy.vim");
  vim.register(async denops => {
    const pos = await denops.call("getpos", ".");
    assertLike([0, 0, 0, 0], pos);
    assertEquals(pos[1], 1);
    assertEquals(pos[2], 3);
  });
});

test("delay option", { delay: 10 }, (vim) => {
  vim.should.exist();
  vim.popup.should.not.exist();
});

test("timeout option", { delay: 10, timeout: 100 }, (vim) => {
  vim.should.exist();
  vim.popup.should.not.exist();
});

test("echo", (vim) => {
  vim.echo("'test'");
  vim.edit("deno.json");
  vim.echo();
});
