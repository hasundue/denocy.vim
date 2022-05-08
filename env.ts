import { join } from "https://deno.land/std@0.137.0/path/mod.ts";
import { ensureDirSync } from "https://deno.land/std@0.137.0/fs/mod.ts";

// Set DENOPS_TEST_VIM and DENOPS_TEST_NVIM
for (const cmd of ["vim", "nvim"]) {
  const key = "DENOPS_TEST_" + cmd.toUpperCase();
  const denocyPath = Deno.env.get("DENOCY_" + cmd.toUpperCase() + "_PATH");

  if (denocyPath) {
    Deno.env.set(key, denocyPath);
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
    }
    catch {
      // do nothing
    }
  }
}

//
// Setup dependencies (denops and denops-popup)
//
const homePath = Deno.env.get("HOME");
if (!homePath) {
  throw new Error("Environment variable HOME is not defined");
}

const denocyDir = Deno.env.get("DENOCY_DIR") ?? join(homePath, ".cache/denocy");
ensureDirSync(denocyDir);

const dirEntries = Array.from(Deno.readDirSync(denocyDir));

// Fetch denops and set DENOPS_PATH if necessary
if (!Deno.env.get("DENOPS_PATH")) {
  const denopsDir = join(denocyDir, "denops.vim");
  const denopsDirEntry = dirEntries.find(entry => entry.isDirectory && entry.name === "denops.vim");

  if (!denopsDirEntry) {
    const proc = Deno.run({
      cmd: ["git", "clone", "https://github.com/vim-denops/denops.vim.git", denopsDir]
    }); 
    await proc.status();
  }

  Deno.env.set("DENOPS_PATH", denopsDir);
}
