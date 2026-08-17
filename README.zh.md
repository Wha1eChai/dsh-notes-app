# dsh-notes-app

[English](README.md) | 中文

独立的 DeepSeek Harness App，用来记短文本。包名 `@dshapps/notes-app`。App ID `dshapps.notes`，`surface: 'panel'`。

这是 Webpage 的消费者，不是 Webpage 的功能。它 peer `@dshapps/webpage`，注册 App ID `dshapps.notes`。pack 只插入本插件。

这个仓库是一次冷启动试验：一个从没见过平台的 agent，只靠项目写作 skill，在单次会话里写出来，用来看合同能不能带一个陌生人。

## 做什么

- `/apps/dshapps.notes` — 写一条短笔记，列出已保存的笔记
- `/apps/dshapps.notes/<noteId>` — 打开一条笔记；刷新后直链仍可用
- 声明 `surface: 'panel'`，对话继续看得见
- 使用可选的 `@dshapps/webpage/ui` 套件
- 笔记存在浏览器里（`localStorage` key `dshapps.notes:v1`）
- 未知 note id 留在 URL 上，显示不可用状态
- 子槽 `dshapps.notes.actions` 留给扩展；空着时不渲染这一节

笔记存在浏览器的 `localStorage`。不同步，不加密。这个 App 不加 Host remotes。

## 要求

- DSH `0.1.0-rc.6`
- Node `^22.19.0 || >=24.0.0`
- pnpm `11.7.0`
- profile 里先有 `@dshapps/webpage` `0.2.0`

## 安装

这一家都还没上 npm。构建后打包这个 App，再加到已经有 `@dshapps/webpage` 的 web profile：

```powershell
dsh plugin --profile web add .\dshapps-webpage-0.2.0.tgz
dsh plugin --profile web add .\dshapps-notes-app-0.2.0.tgz
```

`@dshapps/webpage` 已经装好时，只加 Notes App 的 tarball 也可以。bundle patch 会插入这个 App。先装 `@dshapps/webpage`，让内核已经在 profile 里。

## 校验

```powershell
corepack pnpm@11.7.0 install --frozen-lockfile
corepack pnpm@11.7.0 run verify
```

有些机器上嵌套的 `pnpm run` 会按 `packageManager: pnpm@11.7.0` 解析到 pnpm `11.0.9`，这时直接跑：`node scripts/check.mjs --lint`、`node scripts/check.mjs --pack`，以及 `node node_modules/vitest/vitest.mjs run --coverage`。

## 这一家

平台仓库 [dsh-webpage](https://github.com/dshapps/dsh-webpage) 放内核、写作合同和文档。新 App 从 [dsh-app-template](https://github.com/dshapps/dsh-app-template) 起步。App 故意各自独立成库。

使用 [MIT License](LICENSE)。
