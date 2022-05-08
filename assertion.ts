import type { Denops } from "./deps.ts";
import { assert, AssertionError } from "./deps.ts";

import { DenocyObject } from "./denocy.ts";

export type Args = {
  exist: [];
  beNeovim: [];
  beEmpty: [];
  include: [content: string | RegExp];
  onlyInclude: [content: string];
};

export type Verb = keyof Args;

export const messages: Record<Verb, string> = {
  exist: "",
  beNeovim: "",
  beEmpty: "",
  include: "",
  onlyInclude: "",
}

export function constructInterface(obj: DenocyObject) {
  const entries = Object.entries(obj.verbs);

  const constructAssertionVerb = (assertFunction: typeof assertInternal) => {
    return Object.fromEntries(entries.map(([key, fn]) => ([
      key,
      (...args: Parameters<typeof fn>) => { 
        const anyArg = args as [arg: any]; // use any for cheating deno compiler
        return obj.register(
          async (denops: Denops) => assertFunction(await fn(...anyArg)(denops))
        )
      },
    ])))
  };

  return {
    ...constructAssertionVerb(assertTruthy),
    not: constructAssertionVerb(assertFalsy)
  } as unknown as Interface<keyof typeof obj.verbs>;
}

export function assertTruthy(boolLike: unknown) {
  return assertInternal(boolLike);
}

export function assertFalsy(boolLike: unknown) {
  return assertInternal(!boolLike);
}

function assertInternal(boolLike: unknown) {
  try {
    assert(boolLike);
  }
  catch {
    throw new AssertionError("hoge");
  }
}

export type Impl = {
  [key in Verb]?: 
    (...args: Args[key]) => (denops: Denops) => unknown | Promise<unknown>;
};

export type VerbInterface<T extends Verb> = {
  [key in T]: (...args: Args[key]) => void;
};

export type Interface<T extends Verb> = VerbInterface<T> & {
  not: VerbInterface<T>,
};

export type AbstractInterface = Partial<VerbInterface<Verb>> & {
  not: Partial<VerbInterface<Verb>>
};
