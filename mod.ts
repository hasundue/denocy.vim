import type { Denops } from "./deps.ts";
import { execute } from "./deps.ts";
import { delay } from "./deps.ts";

import "./env.ts";
// We have to import denops_std dynamically because it should be done after environment
// variables are set by env.ts
const Denops = await import("https://deno.land/x/denops_std@v3.10.0/test/mod.ts");

import { Denocy, DenocyContext } from "./denocy.ts";

export type TestDefinition = Omit<Deno.TestDefinition, "fn"> & {
 fn: TestFunction;
 target?: "vim" | "nvim" | "all" | "any";
 delay?: number;
 timeout?: number;
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
      // replace async functions denops#noitfy() and denops#request_async()
      // with a sync function denops#request
      execute(
        denops,
        `
        function! denops#notify(...)
          return call('denops#request', a:000)
        endfunction

        function! denops#request_async(...)
          return call('denops#request', a:000)
        endfunction
        `
      );

      if (pluginName) {
        denops.call("denops#plugin#register", pluginName);
        await denops.call("denops#plugin#wait", pluginName);
      }

      for (const fn of denocy.fns) {
        await fn(denops);

        if (t.delay) {
          await delay(t.delay);
        }
      }
    },
    timeout: t.timeout,
    pluginName: "denocy",
    prelude: pluginName ? [`set runtimepath^=${Deno.cwd()}`] : undefined,
  });
}
