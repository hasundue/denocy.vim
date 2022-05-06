import { assert } from "https://deno.land/std@0.137.0/testing/asserts.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";
import type { Denocy } from "./mod.ts";

export abstract class VimElement {
  abstract denocy: DenocyContext;
  abstract chainer: ChainerDefinition;
  abstract should: AbstractAssertionInterface;

  register(fn: DenopsFunction) {
    this.denocy.fns.push(fn);
    return;
  }

  assertionConstructor<T extends Chainer>() {
    const chainerEntries = Object.entries(this.chainer);

    const construct = (assertFunction: typeof assert) => {
      return Object.fromEntries(chainerEntries.map(([key, fn]) => ([
        key,
        (...args: Parameters<typeof fn>) => this.register(
          async (denops: Denops) => assertFunction(await fn(...args)(denops))
        ),
      ])))
    };

    return {
      ...construct((arg) => assert(arg)),
      not: construct((arg) => assert(!arg)),
    } as AssertionInterface<T>;
  }
}

export class DenocyContext extends VimElement implements Denocy {
  denocy: DenocyContext = this;
  fns: DenopsFunction[] = [];

  chainer = {
    exist: () => async (denops: Denops) => await denops.eval("1"),
    beNeovim: () => async (denops: Denops) => await denops.eval("has('nvim')"),
  };

  should = this.assertionConstructor<keyof typeof this.chainer>();

  edit = (filePath: string): void => this.register(
    async (denops: Denops) => await denops.cmd(`edit ${filePath}`)
  );

  // source: (filePath: string) => void;
  // window: VimWindowApi;
  // buffer: VimBufferApi;
}

type DenopsFunction = (denops: Denops) => void | Promise<void>

type ChainerArgs = {
  exist: [],
  beNeovim: [],
  // count: [number],
}

type Chainer = keyof ChainerArgs;

type ChainerDefinition = {
  [C in Chainer]?: (...args: ChainerArgs[C]) => (denops: Denops) => unknown | Promise<unknown>;
};

type ChainerInterface = {
  [C in Chainer]: (...args: ChainerArgs[C]) => void;
};

type AssertionInterface<T extends Chainer> = Pick<ChainerInterface, T> & {
  not: Pick<ChainerInterface, T>
};

type AbstractAssertionInterface = Partial<ChainerInterface> & {
  not: Partial<ChainerInterface>
};
