import { assert } from "https://deno.land/std@0.137.0/testing/asserts.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";
import { DenocyContext, DenopsFunction } from "./denocy.ts";

export abstract class VimElement {
  denocy?: DenocyContext; // must not be undefined
  abstract chainer: ChainerDefinition;
  abstract should: unknown; // should be AssertionInterface<string>

  constructor(denocy?: DenocyContext) { // the argument is needed except for DenocyContext
    this.denocy = denocy;
  }

  register(fn: DenopsFunction) {
    this.denocy!.fns.push(fn);
    return;
  }

  assertionConstructor<K extends string>() {
    const chainerEntries = Object.entries(this.chainer);

    const construct = (assertFunction: typeof assert) => {
      return Object.fromEntries(chainerEntries.map(([key, fn]) => ([
        key,
        () => this.register(
          async (denops: Denops) => assertFunction(await fn()(denops))
        ),
      ])))
    };

    return {
      ...construct((arg) => assert(arg)),
      not: construct((arg) => assert(!arg)),
    } as AssertionInterface<K>;
  }
}

type ChainerDefinition = {
  [key: string]: () => (denops: Denops) => unknown | Promise<unknown>;
};

type ChainerInterface<K extends string> = {
  [key in K]: () => void;
};

type AssertionInterface<K extends string> = ChainerInterface<K> & {
  not: ChainerInterface<K>,
}
