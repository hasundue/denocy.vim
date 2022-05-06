import { ensureLike, ensureArray } from "https://deno.land/x/unknownutil@v1.1.4/mod.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";
import * as vim from "https://deno.land/x/denops_std@v3.3.1/function/mod.ts";
import type { Denocy } from "./mod.ts";
import { VimElement } from "./element.ts";

export class DenocyContext extends VimElement implements Denocy {
  fns: DenopsFunction[] = [];

  constructor() {
    super();
    this.denocy = this;
  }

  chainer = {
    exist: () => async (denops: Denops) => await denops.eval("1"),
    beNeovim: () => async (denops: Denops) => await denops.eval("has('nvim')"),
    beEmpty: () => this.buffer.chainer.beEmpty(),
  };

  should = this.assertionConstructor<keyof typeof this.chainer>();

  edit = (filePath: string): void => this.register(
    async (denops) => await denops.cmd(`edit ${filePath}`)
  );

  echo = (str: string): void => this.register(
    async (denops) => {
      const result = await denops.eval(`${str}`);
      console.log(result);
    }
  );

  buffer = new BufferInterface(this);

  // source: (filePath: string) => void;
  // window: VimWindowApi;
}

export type DenopsFunction = (denops: Denops) => void | Promise<void>

class BufferInterface extends VimElement {
  chainer = {
    beEmpty: () => this.containing().chainer.beEmpty(),
  };

  containing = (content?: string | RegExp) => new Buffer(
    this.denocy!,
    async (denops) => {
      const list = await vim.getbufinfo(denops);
      ensureArray(list);

      for (const buf of list) {
        ensureLike({ bufnr: 0 }, buf);

        if (!content) {
          return buf.bufnr;
        }

        const lines = await vim.getbufline(denops, buf.bufnr, 1, "$");

        if (lines.some(line => line.match(content))) {
          return buf.bufnr;
        }
      }

      return 0;
    },
  );

  should = this.assertionConstructor<keyof typeof this.chainer>();
}

class Buffer extends VimElement {
  getBufnr: (denops: Denops) => number | Promise<number>;

  constructor(denocy: DenocyContext, getBufnr: (denops: Denops) => number | Promise<number>) {
    super(denocy);
    this.getBufnr = getBufnr;
  }

  chainer = {
    beEmpty: () => async (denops: Denops) => {
      const bufnr = await this.getBufnr(denops);
      const lines = await vim.getbufline(denops, bufnr, 1, "$");
      return lines.some(line => !line.length);
    },
  }

  should = this.assertionConstructor<keyof typeof this.chainer>();
}
