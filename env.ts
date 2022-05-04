// Set DENOPS_TEST_VIM and DENOPS_TEST_NVIM
for (const cmd of ["vim", "nvim"]) {
  const denocyEnv = Deno.env.get("DENOCY_" + cmd.toUpperCase() + "_PATH");
  const denopsEnvKey = "DENOPS_TEST_" + cmd.toUpperCase();

  if (denocyEnv) {
    Deno.env.set(denopsEnvKey, denocyEnv);
  }
  else {
    try {
      const proc = Deno.run({
        cmd: [cmd, "--version"],
        stderr: "null",
        stdout: "null",
      });

      const status = await proc.status();

      if (status.success) {
        Deno.env.set(denopsEnvKey, cmd);
      }

      proc.close();
    }
    catch {
      // do nothing
    }
  }
}

Deno.env.set("DENOPS_PATH", "/home/shun/.cache/dein/repos/github.com/vim-denops/denops.vim");
