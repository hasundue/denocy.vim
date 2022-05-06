import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";
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
    // beEmpty: () => this.buffer.chainer.beEmpty(),
  };

  should = this.assertionConstructor<keyof typeof this.chainer>();

  edit = (filePath: string): void => this.register(
    async (denops: Denops) => await denops.cmd(`edit ${filePath}`)
  );

  // buffer = new BufferInterface(this);

  // source: (filePath: string) => void;
  // window: VimWindowApi;
}

export type DenopsFunction = (denops: Denops) => void | Promise<void>

// class BufferInterface extends VimElement {
//   chainer = {
//     beEmpty: () => {},
//   };

//   should = this.assertionConstructor<keyof typeof this.chainer>();
// }
