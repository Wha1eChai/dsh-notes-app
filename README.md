# dsh-notes-app

English | [中文](README.zh.md)

An independent DeepSeek Harness App for short text notes. Package `@dshapps/notes-app`. App ID `dshapps.notes`, `surface: 'panel'`.

This package is a Webpage consumer, not a Webpage feature. It peers on `@dshapps/webpage` and registers App ID `dshapps.notes`. The pack inserts only this plugin.

This repository was produced in a single session by an agent that had never seen the platform, working only from the project authoring skill, as a cold-start test of whether the contract can carry a stranger.

## What it does

- `/apps/dshapps.notes` — create a short note and list saved notes
- `/apps/dshapps.notes/<noteId>` — open one note; a direct link works after refresh
- Declares `surface: 'panel'` so the conversation stays visible
- Uses the optional `@dshapps/webpage/ui` kit
- Persists notes in the browser (`localStorage` key `dshapps.notes:v1`)
- Unknown note ids stay on the URL and show an unavailable state
- Child slot `dshapps.notes.actions` for later extensions; the section is omitted when empty

Notes are stored in the browser's `localStorage`. They are not synced and not encrypted. The App does not add Host remotes.

## Requirements

- DSH `0.1.0-rc.6`
- Node `^22.19.0 || >=24.0.0`
- pnpm `11.7.0`
- `@dshapps/webpage` `0.2.0` present in the profile first

## Install

Nothing in this family is published to npm yet. Pack this App after a build, then add the tarball to a web profile that already has `@dshapps/webpage`:

```powershell
dsh plugin --profile web add .\dshapps-webpage-0.2.0.tgz
dsh plugin --profile web add .\dshapps-notes-app-0.2.0.tgz
```

Adding the Notes App tarball also works when `@dshapps/webpage` is already installed. The bundle patch inserts this App. Install `@dshapps/webpage` first so the kernel is already in the profile.

## Verify

```powershell
corepack pnpm@11.7.0 install --frozen-lockfile
corepack pnpm@11.7.0 run verify
```

On machines where nested `pnpm run` resolves pnpm `11.0.9` against `packageManager: pnpm@11.7.0`, invoke the scripts directly: `node scripts/check.mjs --lint`, `node scripts/check.mjs --pack`, and `node node_modules/vitest/vitest.mjs run --coverage`.

## Family

The platform repository [dsh-webpage](https://github.com/dshapps/dsh-webpage) holds the kernel, the authoring contract, and the docs. Start a new App from [dsh-app-template](https://github.com/dshapps/dsh-app-template). Apps live in their own repositories on purpose.

Licensed under the [MIT License](LICENSE).
