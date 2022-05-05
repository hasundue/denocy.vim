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
  readonly abstract denocy: DenocyContext;

  register(fn: DenopsFunction) {
    this.denocy.fns.push(fn);
    return;
  }
}

interface VimElementInterface {
  should: AssertionInterface;
  containing?: (content: string | RegExp) => VimElement;
}

interface AssertionInterface {
  exist: () => void;
  beVisible?: () => void;
}

class DenocyContext extends VimElement implements VimElementInterface {
  denocy = this;
  fns: DenopsFunction[] = [];

  should = {
    exist: () => this.register(
      async (denops) => assert(await denops.eval("1") as number)
    ),
  };
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
