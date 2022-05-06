import { ensureLike, ensureArray } from "https://deno.land/x/unknownutil@v1.1.4/mod.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";
import * as vim from "https://deno.land/x/denops_std@v3.3.1/function/mod.ts";
import type { Denocy } from "./mod.ts";
import { DenocyObject, VimElement } from "./element.ts";

export class DenocyContext extends DenocyObject implements Denocy {
  fns: DenopsFunction[] = [];

  register(fn: DenopsFunction) {
    this.fns.push(fn);
  }

  intransive = {
    exist: () => async (denops: Denops) => await denops.eval("1"),
    beNeovim: () => async (denops: Denops) => await denops.eval("has('nvim')"),
    beEmpty: () => this.buffer.intransive.beEmpty(),
  };

  transive = {
  };

  should = this.assertionConstructor<keyof typeof this.intransive, keyof typeof this.transive>();

  edit = (filePath: string): void => this.register(
    async (denops) => await denops.cmd(`edit ${filePath}`)
  );

  echo = (str: string): void => this.register(
    async (denops) => {
      const result = await denops.eval(`${str}`);
      console.log(result);
    }
  );

  buffer = new Buffer(this);

  // source: (filePath: string) => void;
  // window: VimWindowApi;
}

export type DenopsFunction = (denops: Denops) => void | Promise<void>

export interface BufferInterface {
  containing: Buffer["containing"];
  should: Buffer["should"];
}

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

  intransive = {
    beEmpty: () => async (denops: Denops) => {
      const bufnr = await this.getBufnr(denops);
      const lines = await vim.getbufline(denops, bufnr, 1, "$");
      return lines.some(line => !line.length);
    },

    exist: () => this.getBufnr,
  };

  transive = {
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

  should = this.assertionConstructor<keyof typeof this.intransive, keyof typeof this.transive>();
  
  containing = (content?: string | RegExp): BufferInterface => new Buffer(
    this.denocy,
    async (denops) => {
      const list = await vim.getbufinfo(denops);
      ensureArray(list);

      for (const buf of list) {
        ensureLike({ bufnr: 0 }, buf);

        if (!content) return buf.bufnr;

        const lines = await vim.getbufline(denops, buf.bufnr, 1, "$");

        if (lines.some(line => line.match(content))) {
          return buf.bufnr;
        }
      }

      return 0;
    },
  );
}
