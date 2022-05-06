import { assert } from "https://deno.land/std@0.137.0/testing/asserts.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";
import { DenocyContext, DenopsFunction } from "./denocy.ts";

export abstract class DenocyObject {
  abstract intransive: IntransiveDefinition;
  abstract transive: TransiveDefinition;
  abstract should: unknown; // should be AssertionInterface<string>

  abstract register(fn: DenopsFunction): void;

  assertionConstructor<I extends string, T extends string>() {
    const intransiveEntries = Object.entries(this.intransive);

    const constructIntransive = (assertFunction: typeof assert) => {
      return Object.fromEntries(intransiveEntries.map(([key, fn]) => ([
        key,
        () => this.register(
          async (denops: Denops) => assertFunction(await fn()(denops))
        ),
      ])))
    };

    const transiveEntries = Object.entries(this.transive);

    const constructTransive = (assertFunction: typeof assert) => {
      return Object.fromEntries(transiveEntries.map(([key, fn]) => ([
        key,
        (...arg: Parameters<typeof fn>) => this.register(
          async (denops: Denops) => assertFunction(await fn(...arg)(denops))
        ),
      ])))
    };

    return {
      ...constructIntransive((arg) => assert(arg)),
      ...constructTransive((arg) => assert(arg)),
      not: { 
        ...constructIntransive((arg) => assert(!arg)),
        ...constructTransive((arg) => assert(!arg)),
      }
    } as AssertionInterface<I, T>;
  }
}

export abstract class VimElement extends DenocyObject {
  denocy: DenocyContext;

  constructor(denocy: DenocyContext) {
    super();
    this.denocy = denocy;
  }

  register(fn: DenopsFunction) {
    this.denocy.fns.push(fn);
    return;
  }
}

type IntransiveDefinition = {
  [key: string]: () => (denops: Denops) => unknown | Promise<unknown>;
};

type IntransiveInterface<K extends string> = {
  [key in K]: () => void;
};

type TransiveDefinition = {
  [key: string]: (arg: any) => (denops: Denops) => unknown | Promise<unknown>;
};

type TransiveInterface<K extends string> = {
  [key in K]: (arg: unknown) => void;
};

type AssertionInterface<I extends string, T extends string> = 
  IntransiveInterface<I> & TransiveInterface<T> & {
  not: IntransiveInterface<I> & TransiveInterface<T>,
}
