# Kanban App

Local-first Mac kanban board (Electron + React) with reminders, daily summaries, and an MCP server so AI agents can read and edit the same board.

## Quick Start

```bash
npm run dev        # development, hot reload (electron-vite dev server)
npm start          # build, then launch
npm test           # vitest
npm run typecheck  # tsc --noEmit
npm run build      # package a macOS DMG into release/
```

## Architecture

- `src/main.js` — Electron main process: window, IPC handlers, file watcher, reminders, daily summary, global hotkey. Bundled by electron-vite to `dist/main/main.js` (the `main` entry in `package.json`).
- `src/dates.js` — local-date helpers for the main process (summary date, overdue, completed-on). Pure, so vitest can load them.
- `src/store.js` — the data store (CommonJS), shared by the main process and the MCP server: strict `load(path)`, atomic `save(path, data)`.
- `src/shared/task-rules.mjs` — status-transition rules (timestamps, `timeSpent`, `sortOrder`), shared by the renderer reducer and the MCP server. Change them here, not in either caller.
- `src/renderer/` — React 19 + Chakra UI 2 + @dnd-kit, TypeScript, built by electron-vite to `dist/renderer/`. Entry: `index.html` → `main.tsx` → `App.tsx`.
  - `state/` — reducer, context, selectors, types
  - `components/` — `layout/` (header, filter bar, board), `board/` (columns, views), `task/` (cards), `modals/`, `shared/`
  - `hooks/` — IPC wrapper (`useIpc`), keyboard navigation
  - `theme/` — Chakra theme, the seven palettes and their `--c-*` tokens (with `global.css`)
  - `utils/` — pure helpers (dates, colour)
- `src/mcp-server.mjs` — stdio MCP server for Claude Code, Claude Desktop and Codex. Runs under plain `node`, outside Electron. Registration is in `README.md`.

## Data Storage

All in `~/Library/Application Support/kanban-app/` (dev runs and the installed app share it):
- `kanban-data.json` — `{ tasks[], tags[] }`
- `images/` — attachment files (any type), referenced by filename
- `summaries/` — daily summaries, `summary-YYYY-MM-DD.md`

The MCP server uses the same directory; `KANBAN_DATA_DIR` overrides it.

## Data Model

- **Tasks**: id, title, description, status (`todo`/`doing`/`done`), dueDate (`YYYY-MM-DD`), tags[] (tag ids), attachments[], createdAt, startedAt, completedAt, timeSpent (ms), sortOrder, tagSortOrders
- **Tags**: id, name, color
- **Attachments**: `{ filename, originalName, type }` — filename on disk, display name, MIME type
- Date-only values are local `YYYY-MM-DD` strings. Parse them as local dates and compare them as strings. Never use `toISOString()` for a date-only value (it is UTC and shifts the day).

## Sharing the File With Agents

The app and the MCP server both write `kanban-data.json`, so:
- **Atomic writes.** `store.save` writes a pid-suffixed temp file, then renames it over the data file. Never write the data file directly.
- **Watch and reload.** The main process watches the data directory (not the file — a rename replaces the inode). When the file's content differs from what the app last loaded or saved, it sends `data-changed-external` and the renderer reloads.
- **Stale-write guard.** `save-data` refuses to write when the file on disk differs from what the app last loaded or saved, and triggers a reload instead.
- The renderer does not save in response to data that came from disk.
- A corrupt data file is an error, not an empty board: `load` throws, the app shows the error with the file path and does not save.

## IPC Channels

Renderer → main (`ipcRenderer.invoke`):
- `load-data` / `save-data` — load/persist the full data object
- `save-image` — base64 data URI → file in `images/`
- `save-file` — base64 + metadata → file in `images/`
- `load-image` — filename → base64 data URI
- `delete-image` — remove a file from `images/`
- `open-attachment` — open an attachment with the system default app
- `list-summaries` / `read-summary` / `generate-summary` — daily summaries
- `get-paths` — data, summaries and images paths

Main → renderer (`webContents.send`):
- `data-changed-external` — the data file changed on disk; reload
- `quick-add-task` — the global hotkey fired; open quick add

Handlers that take a filename reject anything where `path.basename(name) !== name`.

## Important Gotchas

- Never run against the real data dir when testing. Launch with `--user-data-dir=<scratch copy>`; for the MCP server set `KANBAN_DATA_DIR`.
- Tasks can appear in multiple tag columns (multi-tag).
- `sortOrder` orders a task within its status column; `tagSortOrders[tagId]` orders it within each tag column. They are independent.
- In tag view a column id is a tag id or `__untagged__`. Never write one into `status`.
- The renderer talks to main through `window.require('electron')` (`nodeIntegration` on, `contextIsolation` off). `src/preload.js` is an empty placeholder.
- Closing the window hides it; the app keeps running for reminders and the global hotkey until Cmd+Q. There is no tray icon.

## Code Style

- TypeScript and function components in the renderer; state changes go through the reducer.
- Colours come from the `--c-*` CSS variables (via `colors` in `src/renderer/theme`), never hard-coded, so all seven palettes work.
- No new dependencies without a reason. Minimum code; no speculative abstraction.
- Bug fixes are test-first with vitest: write a failing `*.test.ts` next to the code, then fix. Extract a pure function if the logic is buried in a component.
- `npm test`, `npm run typecheck` and `npx electron-vite build` must pass before committing.

## Spec

`docs/specs/2026-11-14-kanban-overhaul.md` defines the current design, ground rules and backlog.
