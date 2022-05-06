import { assert } from "https://deno.land/std@0.137.0/testing/asserts.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";
import { DenocyContext, DenopsFunction } from "./denocy.ts";

export abstract class DenocyObject {
  abstract verbs: AssertionVerbDefinition;
  abstract should: AbstractAssertionInterface;

  abstract register(fn: DenopsFunction): void;

  assertionConstructor<T extends AssertionVerb>() {
    const transiveEntries = Object.entries(this.verbs);

    const constructAssertionVerb = (assertFunction: typeof assert) => {
      return Object.fromEntries(transiveEntries.map(([key, fn]) => ([
        key,
        (...args: Parameters<typeof fn>) => { 
          const anyArg = args as [arg: any]; // use any for cheating deno compiler
          return this.register(
            async (denops: Denops) => assertFunction(await fn(...anyArg)(denops))
          )
        },
      ])))
    };

    return {
      ...constructAssertionVerb((arg) => assert(arg)),
      not: constructAssertionVerb((arg) => assert(!arg)),
    } as unknown as AssertionInterface<T>;
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

type AssertionVerbArgs = {
  exist: [];
  beNeovim: [];
  beEmpty: [];
  include: [content: string | RegExp];
  onlyInclude: [content: string];
};

type AssertionVerb = keyof AssertionVerbArgs;

type AssertionVerbDefinition = {
  [key in AssertionVerb]?: 
    (...args: AssertionVerbArgs[key]) => (denops: Denops) => unknown | Promise<unknown>;
};

type AssertionVerbInterface<T extends AssertionVerb> = {
  [key in T]: (...args: AssertionVerbArgs[key]) => void;
};

type AssertionInterface<T extends AssertionVerb> = AssertionVerbInterface<T> & {
  not: AssertionVerbInterface<T>,
};

type AbstractAssertionInterface = Partial<AssertionVerbInterface<AssertionVerb>> & {
  not: Partial<AssertionVerbInterface<AssertionVerb>>
};
