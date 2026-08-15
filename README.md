# dsh-notes-app

An independent DeepSeek Harness App for short text notes.

This package is a Webpage consumer, not a Webpage feature. It peers on `@wha1echai/dsh-webpage` and registers App ID `wha1echai.notes`. The pack inserts only this plugin.

## What it does

- `/apps/wha1echai.notes` — create a short note and list saved notes
- `/apps/wha1echai.notes/<noteId>` — open one note; a direct link works after refresh
- Declares `surface: 'panel'` so the conversation stays visible
- Uses the optional `@wha1echai/dsh-webpage/ui` kit
- Persists notes in the browser (`localStorage` key `wha1echai.notes:v1`)
- Unknown note ids stay on the URL and show an unavailable state
- Child slot `wha1echai.notes.actions` for later extensions; the section is omitted when empty

It does not sync across devices, encrypt notes, or add Host remotes.

## Requirements

- DSH `0.1.0-rc.6`
- Node `^22.19.0 || >=24.0.0`
- pnpm `11.7.0`
- `@wha1echai/dsh-webpage` `0.1.0` (listed first in this package's Pack)

## Install

Webpage is not on npm yet. Pack both packages, then add this App to a disposable or chosen web profile:

```powershell
dsh plugin --profile web add .\wha1echai-dsh-webpage-0.1.0.tgz
dsh plugin --profile web add .\wha1echai-dsh-notes-app-0.1.0.tgz
```

Adding the Notes App tarball also works when `@wha1echai/dsh-webpage` is already installed. The bundle patch inserts this App. Install `@wha1echai/dsh-webpage` first so the kernel is already in the profile.

## Verify

```powershell
pnpm install --frozen-lockfile
pnpm verify
```

On machines where nested `pnpm run` resolves pnpm `11.0.9` against `packageManager: pnpm@11.7.0`, invoke the scripts directly: `node scripts/check.mjs --lint`, `node scripts/check.mjs --pack`, and `node node_modules/vitest/vitest.mjs run --coverage`.
