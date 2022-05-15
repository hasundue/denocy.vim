import type { Denops } from "./deps.ts";

import "./env.ts";
// We have to import denops_std dynamically because it should be done after environment
// variables are set by env.ts
const Denops = await import("https://deno.land/x/denops_std@v3.3.1/test/mod.ts");

import { Denocy, DenocyContext } from "./denocy.ts";

export type TestDefinition = Omit<Deno.TestDefinition, "fn"> & {
 fn: TestFunction;
 target?: "vim" | "nvim" | "all" | "any";
};

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

  const pluginName = Deno.env.get("DENOCY_PLUGIN_NAME");

  Denops.test({
    ...t,
    mode: t.target ?? "any",
    fn: async (denops: Denops) => {
      if (pluginName) {
        denops.call("denops#plugin#register", pluginName);
        await denops.call("denops#plugin#wait", pluginName);
      }
      for (let i = 0; i < denocy.fns.length; i++) {
        await denocy.fns[i](denops);
      }
    },
    pluginName: "denocy",
    prelude: pluginName ? [`set runtimepath^=${Deno.cwd()}`] : undefined,
  });
}
