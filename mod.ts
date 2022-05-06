import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";

import "./env.ts"; // set environment variables
const Denops = await import("https://deno.land/x/denops_std@v3.3.1/test/mod.ts");

import { DenocyContext } from "./denocy.ts";

export interface Denocy {
  should: DenocyContext["should"];
  edit: DenocyContext["edit"];
}

export const Denocy = {
  test,
}

export type TestDefinition = Omit<Deno.TestDefinition, "fn"> & {
 fn: TestFunction;
 target?: "vim" | "nvim" | "all" | "any";
};

type TestOptions = Omit<TestDefinition, "name" | "fn">;
type TestFunction = (cy: Denocy) => void;

function test(t: TestDefinition): void;
function test(name: string, fn: TestFunction): void;
function test(name: string, options: TestOptions, fn: TestFunction): void;

function test(
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
