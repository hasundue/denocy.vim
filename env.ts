import { join } from "https://deno.land/std@0.183.0/path/mod.ts";
import { ensureDirSync } from "https://deno.land/std@0.183.0/fs/mod.ts";

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
// Set DENOCY_PLUGIN_NAME
//
const cwd = Deno.cwd();
const dirEntries = Array.from(Deno.readDirSync(cwd));
const srcDirEntry = dirEntries.find(
  entry => entry.isDirectory && entry.name.match(/(autoload)|(lua)|(denops)/)
);

if (srcDirEntry) {
  const srcEntries = Array.from(Deno.readDirSync(srcDirEntry.name));

  if (srcDirEntry.name === "denops") {
    if (srcEntries[0]) {
      const name = srcEntries[0].name;
      Deno.env.set("DENOCY_PLUGIN_NAME", name);
    }
  }
  else {
    const regExp = /.+(?=\.[(vim)|(lua)])/;
    const srcFileEntry = srcEntries.find(entry => entry.name.match(regExp));
    if (srcFileEntry) {
      const match = srcFileEntry.name.match(regExp)![0];
      Deno.env.set("DENOCY_PLUGIN_NAME", match);
    }
  }
}

//
// Setup denops.vim
//
const homePath = Deno.env.get("HOME");
if (!homePath) {
  throw new Error("Environment variable HOME is not defined");
}

const denocyDir = Deno.env.get("DENOCY_DIR") ?? join(homePath, ".cache/denocy");
ensureDirSync(denocyDir);

const denocyDirEntries = Array.from(Deno.readDirSync(denocyDir));

// Fetch denops and set DENOPS_PATH if necessary
if (!Deno.env.get("DENOPS_PATH")) {
  const denopsDir = join(denocyDir, "denops.vim");
  const denopsDirEntry = denocyDirEntries.find(entry => entry.isDirectory && entry.name === "denops.vim");

  if (!denopsDirEntry) {
    const proc = Deno.run({
      cmd: ["git", "clone", "https://github.com/vim-denops/denops.vim.git", denopsDir]
    }); 
    await proc.status();
  }

  Deno.env.set("DENOPS_PATH", denopsDir);
}
