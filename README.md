# denocy.vim
An end-to-end testing library for Vim/Neovim powered by [denops.vim](https://github.com/vim-denops/denops.vim), inspired by modern Javascript testing frameworks like [Cypress](https://docs.cypress.io/).

![screenshot](https://i.gyazo.com/7f59d885f55df5a78ddfe88f06c8b340.png)

## Key Features
- Pseudo-Synchronous API
  - Easy to write/read
  - Run denops plugins synchronously as much as possible
- (TODO) Asynchronous API
- Human-readable selectors and matchers optimized for Vim

## Requirements
- Latest [Deno](https://deno.land) runtime
- Git (unless you use your own clone of denops.vim)

## Installation
Installation is not required, since Denocy is a Deno module.
You can use Denocy by importing it remotely like other Deno modules (see Getting Started).

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

## Getting Started

### Use Denocy

```typescript
import { test } from "https://pax.deno.dev/hasundue/denocy.vim/mod.ts";
```

This will clone the denops.vim repository into DENOCY_DIR (default: ~/.cache/denocy) and set environment variables required to use the test module of Denops.
