import type { Denops } from "./deps.ts";
import { assertLike, assertArray } from "./deps.ts";
import { vim, popup } from "./deps.ts";

import * as Assertion from "./assertion.ts";

export abstract class DenocyObject {
  abstract expr: string;
  abstract verbs: Assertion.Impl;
  abstract should: Assertion.AbstractInterface;

  abstract register(fn: DenopsFunction): void;
}

type DenopsFunction = (denops: Denops) => void | Promise<void>

export type Denocy = {
  buffer: BufferInterface;
  window: WindowInterface;
  popup: WindowInterface;
} & Omit<DenocyContext, "expr" | "verbs" | "fns" | "window" | "buffer" | "popup">;

export class DenocyContext extends DenocyObject implements Denocy {
  expr = "vim";
  fns: DenopsFunction[] = [];

  register(fn: DenopsFunction) {
    this.fns.push(fn);
  }

  buffer = new Buffer(this, "buffer");
  window = new Window(this, "window");
  popup = new Popup(this, "popup");

  verbs = {
    exist: () => async (denops: Denops) => await denops.eval("1"),
  };

  should: Assertion.Interface<keyof typeof this.verbs> = Assertion.constructInterface(this);

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

abstract class VimElement extends DenocyObject {
  denocy: DenocyContext;
  expr: string;

  constructor(denocy: DenocyContext, expr: string) {
    super();
    this.denocy = denocy;
    this.expr = expr;
  }

  register(fn: DenopsFunction) {
    this.denocy.fns.push(fn);
    return;
  }

  abstract containing: (content: string | RegExp) => VimElementInterface<VimElement>;
}

interface VimElementInterface<E extends VimElement> {
  should: E["should"];
  containing: E["containing"];
}

class Buffer extends VimElement {
  getBufnr: (denops: Denops) => number | Promise<number>;

  constructor(denocy: DenocyContext, expr: string);
  constructor(denocy: DenocyContext, expr: string, getBufnr: (denops: Denops) => number | Promise<number>);

  constructor(
    denocy: DenocyContext,
    expr: string,
    getBufnr?: (denops: Denops) => number | Promise<number>
  ) {
    super(denocy, expr);

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

  should: Assertion.Interface<keyof typeof this.verbs> = Assertion.constructInterface(this);
  
  containing = (content: string | RegExp): BufferInterface => new Buffer(
    this.denocy,
    `buffer containing ${content}`,
    async (denops) => await findBuffer(denops, content),
  );
}

type BufferInterface = VimElementInterface<Buffer>;

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

class Window extends VimElement {
  getWinnr: (denops: Denops) => number | Promise<number>;

  constructor(denocy: DenocyContext, expr: string);
  constructor(denocy: DenocyContext, expr: string, getWinnr: (denops: Denops) => number | Promise<number>);

  constructor(
    denocy: DenocyContext,
    expr: string,
    getWinnr?: (denops: Denops) => number | Promise<number>
  ) {
    super(denocy, expr);
    this.getWinnr = getWinnr ?? (denops => vim.winnr(denops) as Promise<number>);
  }

  getBufnr = async (denops: Denops) => {
    const winnr = await this.getWinnr(denops)
    return await vim.winbufnr(denops, winnr) as number;
  };

  getWinid = async (denops: Denops) => {
    const bufnr = await this.getBufnr(denops);
    return vim.bufwinid(denops, bufnr);
  };

  verbs = {
    exist: () => async (denops: Denops) => await this.getWinnr(denops) > -1,
    beEmpty: new Buffer(this.denocy, this.expr, this.getBufnr).verbs.beEmpty,
    include: new Buffer(this.denocy, this.expr, this.getBufnr).verbs.include,
    onlyInclude: new Buffer(this.denocy, this.expr, this.getBufnr).verbs.onlyInclude,
  };

  should: Assertion.Interface<keyof typeof this.verbs> = Assertion.constructInterface(this);

  containing = (content: string | RegExp): WindowInterface => new Window(
    this.denocy,
    `window containing ${content}`,
    async (denops) => {
      const bufnr = await findBuffer(denops, content);
      return vim.bufwinnr(denops, bufnr);
    },
  );
}

type WindowInterface = VimElementInterface<Window>;

class Popup extends Window {
  constructor(denocy: DenocyContext, expr: string) {
    super(denocy, expr, async (denops) => {
      const list = await popup.list(denops);
      if (list.length) {
        return list[0];
      }
      return -1;
    })
  }
}
