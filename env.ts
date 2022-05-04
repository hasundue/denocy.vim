import { join } from "https://deno.land/std@0.137.0/path/mod.ts";
import { ensureDirSync } from "https://deno.land/std@0.137.0/fs/mod.ts";

// Set DENOPS_TEST_VIM and DENOPS_TEST_NVIM
for (const cmd of ["vim", "nvim"]) {
  const key = "DENOPS_TEST_" + cmd.toUpperCase();
  const DENOCY_PATH = Deno.env.get("DENOCY_" + cmd.toUpperCase() + "_PATH");

  if (DENOCY_PATH) {
    Deno.env.set(key, DENOCY_PATH);
  }
  else {
    try {
      // Check if vim/nvim is executable
      const proc = Deno.run({
        cmd: [cmd, "--version"],
        stderr: "null",
        stdout: "null",
      });

      const status = await proc.status();

      if (status.success) {
        Deno.env.set(key, cmd);
      }

      proc.close();
    }
    catch {
      // do nothing
    }
  }
}

// Set DENOPS_PATH
if (!Deno.env.get("DENOPS_PATH")) {
  const HOME = Deno.env.get("HOME");
  if (!HOME) {
    throw new Error("Environment variable HOME is not defined");
  }

  const DENOCY_DIR = join(HOME, ".cache/denocy");
  ensureDirSync(DENOCY_DIR);

  const DENOPS_DIR = join(DENOCY_DIR, "denops.vim");

  const dirEntries = Array.from(Deno.readDirSync(DENOCY_DIR));
  const denopsDirEntry = dirEntries.find(entry => entry.isDirectory && entry.name === "denops.vim");

  if (!denopsDirEntry) {
    const proc = Deno.run({
      cmd: ["git", "clone", "https://github.com/vim-denops/denops.vim.git", DENOPS_DIR]
    }); 
    await proc.status();
  }

  Deno.env.set("DENOPS_PATH", DENOPS_DIR);
}
