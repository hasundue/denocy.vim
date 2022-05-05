import { assert } from "https://deno.land/std@0.137.0/testing/asserts.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";

import "./env.ts"; // set environment variables
const Denops = await import("https://deno.land/x/denops_std@v3.3.1/test/mod.ts");

export type TestDefinition = Omit<Deno.TestDefinition, "fn"> & {
 fn: TestFunction;
 target?: "vim" | "nvim" | "all" | "any";
};

type DenopsFunction = (denops: Denops) => void | Promise<void>

abstract class VimElement<ChainerUnion extends Chainer> {
  readonly abstract denocy: DenocyContext;
  readonly abstract chainer: Record<ChainerUnion, ChainerFunction>;
  readonly abstract should: AssertionInterface<ChainerUnion>;

  register(fn: DenopsFunction) {
    this.denocy.fns.push(fn);
    return;
  }

  shouldConstructor() {
    const chainerEntries = Object.entries(this.chainer) as [ChainerUnion, ChainerFunction][];

    const affirmation = Object.fromEntries(chainerEntries.map(([key, fn]) => ([
      key,
      () => this.register(async (denops: Denops) => assert(await fn()(denops))),
    ])))

    const negation = Object.fromEntries(chainerEntries.map(([key, fn]) => ([
      key,
      () => this.register(async (denops: Denops) => assert(!(await fn()(denops)))),
    ])))

    return { ...affirmation, not: negation } as AssertionInterface<ChainerUnion>
  }
}

const Chainer = [
  "exist",
  "beNvim",
] as const;

type Chainer = typeof Chainer[number];

type ChainerFunction = () => (denops: Denops) => unknown | Promise<unknown>;
type AssertionFunction = () => void;

type AssertionInterface<ChainerUnion extends Chainer> = Record<ChainerUnion, AssertionFunction> & { 
  not: Record<ChainerUnion, AssertionFunction>
}

class DenocyContext extends VimElement<"exist" | "beNvim"> {
  denocy = this;
  fns: DenopsFunction[] = [];

  chainer = {
    exist: () => async (denops: Denops) => await denops.eval("1"),
    beNvim: () => async (denops: Denops) => await denops.eval("has('nvim')"),
  };

  should = this.shouldConstructor();

  // source: (filePath: string) => void;
  // open: (filePath: string) => void;
  // window: VimWindowApi;
  // buffer: VimBufferApi;
}

type TestOptions = Omit<TestDefinition, "name" | "fn">;
type TestFunction = (cy: DenocyContext) => void;

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
