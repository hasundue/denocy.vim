# denocy.vim
An end-to-end testing framework for Vim/Neovim, inspired by [Cypress](https://docs.cypress.io/), and powered by [denops.vim](https://github.com/vim-denops/denops.vim).

## Requirements
- Latest [Deno](https://deno.land) runtime
- Git (unless you set DENOPS_DIR manually)

## Installation
Installation is not required, since Denocy is a Deno module.

You can use Denocy by importing it remotely like other Deno modules:

```
import { test } from "https://pax.deno.dev/hasundue/denocy.vim/mod.ts";
```

This will clone the denops.vim repository into DENOCY_DIR (default: ~/.cache/denocy) and set environment variables required to use the test module of denops.vim (DENOPS_TEST_VIM, DENOPS_TEST_NVIM, and DENOPS_PATH).

## Configuration
Denocy is supposed to work with zero configuration, but the following environment variables are available to tweak:

#### DENOCY_DIR
Path to a directory where Denocy caches temporary files (default: ~/.cache/denocy)

#### DENOCY_VIM_PATH 
Path to Vim executable (default: vim)

#### DENOCY_NVIM_PATH
Path to Neovim executable (default: nvim)

#### DENOPS_PATH
Path to a cloned repository of denops.vim (default: ~/.cache/denocy/denops.vim)
