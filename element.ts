import type { Denops } from "./deps.ts";
import { assert } from "./deps.ts";

import { DenocyContext, DenopsFunction } from "./denocy.ts";

export abstract class DenocyObject {
  protected abstract verbs: AssertionVerbDefinition;
  abstract should: AbstractAssertionInterface;

  abstract register(fn: DenopsFunction): void;

  protected assertionConstructor<T extends AssertionVerb>() {
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

export abstract class VimElement extends DenocyObject implements VimElementInterface<VimElement> {
  denocy: DenocyContext;

  constructor(denocy: DenocyContext) {
    super();
    this.denocy = denocy;
  }

  register(fn: DenopsFunction) {
    this.denocy.fns.push(fn);
    return;
  }

  abstract containing: (content: string | RegExp) => VimElementInterface<VimElement>;
}

export interface VimElementInterface<E extends VimElement> {
  should: E["should"];
  containing: E["containing"];
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
