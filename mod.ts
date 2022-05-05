import { assert } from "https://deno.land/std@0.137.0/testing/asserts.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";

import "./env.ts"; // set environment variables
const Denops = await import("https://deno.land/x/denops_std@v3.3.1/test/mod.ts");

export type TestDefinition = Omit<Deno.TestDefinition, "fn"> & {
 fn: TestFunction;
 target?: "vim" | "nvim" | "all" | "any";
};

type DenopsFunction = (denops: Denops) => void | Promise<void>

abstract class VimElement {
  abstract denocy: DenocyContext;
  abstract chainer: ChainerDefinition;
  abstract should: AbstractAssertionInterface;

  register(fn: DenopsFunction) {
    this.denocy.fns.push(fn);
    return;
  }

  assertionConstructor<T extends Chainer>() {
    const chainerEntries = Object.entries(this.chainer);

    const affirmation = Object.fromEntries(chainerEntries.map(([key, fn]) => ([
      key,
      (...args: Parameters<typeof fn>) => this.register(
        async (denops: Denops) => assert(await fn(...args)(denops))
      ),
    ])))

    const negation = Object.fromEntries(chainerEntries.map(([key, fn]) => ([
      key,
      (...args: Parameters<typeof fn>) => this.register(
        async (denops: Denops) => assert(!(await fn(...args)(denops)))
      ),
    ])))

    return { ...affirmation, not: negation } as AssertionInterface<T>;
  }
}

type ChainerArgs = {
  exist: [],
  beNvim: [],
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

class DenocyContext extends VimElement {
  denocy: DenocyContext = this;
  fns: DenopsFunction[] = [];

  chainer = {
    exist: () => async (denops: Denops) => await denops.eval("1"),
    beNvim: () => async (denops: Denops) => await denops.eval("has('nvim')"),
  };

  should = this.assertionConstructor<keyof typeof this.chainer>();

  // source: (filePath: string) => void;
  // open: (filePath: string) => void;
  // window: VimWindowApi;
  // buffer: VimBufferApi;
}

interface Denocy {
  should: DenocyContext["should"];
}

type TestOptions = Omit<TestDefinition, "name" | "fn">;
type TestFunction = (cy: Denocy) => void;

export function test(t: TestDefinition): void;
export function test(name: string, fn: TestFunction): void;
export function test(name: string, options: TestOptions, fn: TestFunction): void;

export function test(
  arg1: TestDefinition | string,
  arg2?: TestFunction | TestOptions,
  arg3?: TestFunction,
) {
  if (typeof arg1 !== "string") {
    runTest(arg1);
  }
  else if (arg3) {
    runTest({
      name: arg1,
      fn: arg3,
      ...arg2 as TestOptions,
    });
  }
  else {
    runTest({
      name: arg1,
      fn: arg2 as TestFunction,
    });
  }
}

function runTest(t: TestDefinition) {
  const denocy = new DenocyContext();
  t.fn(denocy); // convert TestFunctions to DenopsFunctions and register them in denocy.fns

  Denops.test({
    ...t,
    mode: t.target ?? "any",
    fn: async (denops: Denops) => {
      for (let i = 0; i < denocy.fns.length; i++) {
        await denocy.fns[i](denops);
      }
    },
  });
}
