import { assertLike, assertArray } from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";
import * as vim from "https://deno.land/x/denops_std@v3.3.1/function/mod.ts";
import { DenocyObject, VimElement, VimElementInterface } from "./element.ts";

export type Denocy = {
  buffer: BufferInterface;
  window: WindowInterface;
} & Omit<DenocyContext, "fns" | "register" | "window" | "buffer">;

export class DenocyContext extends DenocyObject implements Denocy {
  fns: DenopsFunction[] = [];

  register(fn: DenopsFunction) {
    this.fns.push(fn);
  }

  window = new Window(this);
  buffer = new Buffer(this);

  protected verbs = {
    exist: () => async (denops: Denops) => await denops.eval("1"),
    beNeovim: () => async (denops: Denops) => await denops.eval("has('nvim')"),
  };

  should = this.assertionConstructor<keyof typeof this.verbs>();

  edit = (filePath: string): void => this.register(
    async (denops) => await denops.cmd(`edit ${filePath}`)
  );

  echo = (str: string): void => this.register(
    async (denops) => {
      const result = await denops.eval(`${str}`);
      console.log(result);
    }
  );

  // source: (filePath: string) => void;
}

export type DenopsFunction = (denops: Denops) => void | Promise<void>

type BufferInterface = VimElementInterface<Buffer>;

class Buffer extends VimElement {
  getBufnr: (denops: Denops) => number | Promise<number>;

  constructor(denocy: DenocyContext, getBufnr: (denops: Denops) => number | Promise<number>);
  constructor(denocy: DenocyContext);

  constructor(denocy: DenocyContext, getBufnr?: (denops: Denops) => number | Promise<number>) {
    super(denocy);

    if (getBufnr) {
      this.getBufnr = getBufnr;
    }
    else {
      this.getBufnr = async (denops) => await vim.bufnr(denops);
    }
  }

  verbs = {
    exist: () => this.getBufnr,

    beEmpty: () => async (denops: Denops) => {
      const bufnr = await this.getBufnr(denops);
      const lines = await vim.getbufline(denops, bufnr, 1, "$");
      return lines.some(line => !line.length);
    },

    include: (content: string | RegExp) => async (denops: Denops) => {
      const bufnr = await this.getBufnr(denops);
      const lines = await vim.getbufline(denops, bufnr, 1, "$");
      return lines.some(line => line.match(content));
    },

    onlyInclude: (content: string) => async (denops: Denops) => {
      const bufnr = await this.getBufnr(denops);
      const lines = await vim.getbufline(denops, bufnr, 1, "$");
      return lines.length === 1 && lines[0] === content;
    },
  };

  should = this.assertionConstructor<keyof typeof this.verbs>();
  
  containing = (content: string | RegExp): BufferInterface => new Buffer(
    this.denocy,
    async (denops) => await findBuffer(denops, content),
  );
}

async function findBuffer(denops: Denops, content: string | RegExp) {
  const list = await vim.getbufinfo(denops);
  assertArray(list);

  for (const buf of list) {
    assertLike({ bufnr: 0 }, buf);

    const lines = await vim.getbufline(denops, buf.bufnr, 1, "$");

    if (lines.some(line => line.match(content))) {
      return buf.bufnr;
    }
  }

  return 0;
}

type WindowInterface = VimElementInterface<Window>;

class Window extends VimElement {
  getWinnr: (denops: Denops) => number | Promise<number>;

  constructor(denocy: DenocyContext, getWinnr: (denops: Denops) => number | Promise<number>);
  constructor(denocy: DenocyContext);

  constructor(denocy: DenocyContext, getWinnr?: (denops: Denops) => number | Promise<number>) {
    super(denocy);

    if (getWinnr) {
      this.getWinnr = getWinnr;
    }
    else {
      this.getWinnr = (denops) => vim.winnr(denops) as Promise<number>;
    }
  }

  getBufnr = async (denops: Denops) => {
    const winnr = await this.getWinnr(denops)
    return await vim.winbufnr(denops, winnr) as number;
  };

  verbs = {
    exist: () => async (denops: Denops) => await this.getWinnr(denops) > -1,
  };

  should = this.assertionConstructor<keyof typeof this.verbs>()

  containing = (content: string | RegExp): WindowInterface => new Window(
    this.denocy,
    async (denops) => {
      const bufnr = await findBuffer(denops, content);
      return vim.bufwinnr(denops, bufnr);
    },
  );
}
