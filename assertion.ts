import type { Denops } from "./deps.ts";
import { assert, AssertionError } from "./deps.ts";

import { DenocyObject } from "./denocy.ts";

type Args = {
  exist: [];
  beNeovim: [];
  beEmpty: [];
  include: [content: string | RegExp];
  onlyInclude: [content: string];
};

type Verb = keyof Args;

const exprs: Record<Verb, string> = {
  exist: "exist",
  beNeovim: "be Neovim",
  beEmpty: "be empty",
  include: "include",
  onlyInclude: "only include",
}

export function constructInterface(obj: DenocyObject) {
  const entries = Object.entries(obj.verbs);

  const constructAssertionVerb = (assertFunction: typeof assertTruthy) => {
    return Object.fromEntries(entries.map(([key, fn]) => ([
      key,
      (...args: Parameters<typeof fn>) => { 
        const anyArg = args as [arg: any]; // use any for cheating deno compiler
        return obj.register(async (denops: Denops) => assertFunction(
          obj,
          key as Verb,
          args,
          await fn(...anyArg)(denops)
        ));
      },
    ])))
  };

  return {
    ...constructAssertionVerb(assertTruthy),
    not: constructAssertionVerb(assertFalsy)
  } as Interface<keyof typeof obj.verbs>;
}

function assertTruthy(obj: DenocyObject, verb: Verb, args: unknown[], boolLike: unknown) {
  return assertInternal(obj, verb, "", args, boolLike);
}

function assertFalsy(obj: DenocyObject, verb: Verb, args: unknown[], boolLike: unknown) {
  return assertInternal(obj, verb, "not ", args, !boolLike);
}

function assertInternal(
  obj: DenocyObject,
  verb: Verb,
  not: "not " | "",
  args: unknown[],
  boolLike: unknown
) {
  try {
    assert(boolLike);
  }
  catch {
    const wasOrDid = exprs[verb].includes("be ") ? "was" : "did";
    const lastNot = not ? "" : " not";
    const object = args.length ? ` "${args[0]}"` : "";
    throw new AssertionError(
      `${obj.expr} had ${not}been expected to ${exprs[verb]}${object}, but it ${wasOrDid}${lastNot}.`
    );
  }
}

export type Impl = {
  [key in Verb]?: 
    (...args: Args[key]) => (denops: Denops) => unknown | Promise<unknown>;
};

type VerbInterface<T extends Verb> = {
  [key in T]: (...args: Args[key]) => void;
};

export type Interface<T extends Verb> = VerbInterface<T> & {
  not: VerbInterface<T>,
};

export type AbstractInterface = Partial<VerbInterface<Verb>> & {
  not: Partial<VerbInterface<Verb>>
};
