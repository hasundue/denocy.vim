import { assert } from "https://deno.land/std@0.133.0/testing/asserts.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";

import "./env.ts";
const Denops = await import("https://deno.land/x/denops_std@v3.3.1/test/mod.ts");

export type TestDefinition = Omit<Deno.TestDefinition, "fn"> & {
 fn: (cy: DenocyContext) => void | Promise<void>;
 target?: "vim" | "nvim" | "all" | "any";
};

type DenocyContext = { denops: Denops } & VimElement & {
  // source: (filePath: string) => void;
  // open: (filePath: string) => void;
  // window: VimWindowApi;
  // buffer: VimBufferApi;
};

const DenocyContext = {
  from: (denops: Denops): DenocyContext => ({
    denops,
    should: {
      exist: () => assert(true),
    },
  }),
}

interface VimElement {
  // get: (selector: string) => VimElement;
  // contains: (content: string | RegExp) => VimElement;
  should: AssertionInterface;
}

interface AssertionInterface {
  exist: () => void;
  beVisible?: () => void;
}

type TestOptions = Omit<TestDefinition, "name" | "fn">;
type TestFunction = (cy: DenocyContext) => void | Promise<void>;

export function test(t: TestDefinition): void;
export function test(name: string, fn: (cy: DenocyContext) => void | Promise<void>): void;
export function test(
  name: string,
  options: TestOptions,
  fn: (cy: DenocyContext) => void | Promise<void>,
): void;

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
  Denops.test({
    ...t,
    mode: t.target ?? "any",
    fn: (denops: Denops) => {
      const cy = DenocyContext.from(denops);
      t.fn(cy);
    },
  });
}
