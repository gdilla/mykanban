# Kanban overhaul — spec and tickets

Date: 2026-11-14. Source: four-part audit (engineering, renderer UX, agent integration, live run).

## Destination

A local-first Mac kanban board that:

1. Launches with `npm start` and packages with `npm run build`.
2. Shares one data file safely with AI agents: an agent's write shows up in the open app within a second, and the app never overwrites a change it has not seen.
3. Exposes a compact MCP server that Claude Code, Claude Desktop and Codex can use without burning context.
4. Has drag, keyboard and date behaviour that is correct and predictable.
5. Looks like one product: one visual language across every window, readable in all seven palettes, native Mac title bar.

## Ground rules for every ticket

- **The app is React.** Renderer in `src/renderer/`, main process `src/main.js`, MCP server `src/mcp-server.mjs`. `src/index.html` is the dead legacy vanilla UI: read it as a behaviour reference only, never edit it, never load it.
- **Data**: `~/Library/Application Support/kanban-app/kanban-data.json` (`{ tasks[], tags[] }`), `images/`, `summaries/`. Dates are local `YYYY-MM-DD` strings. Never use `toISOString()` for a date-only value.
- **Never run against the real data dir.** Launch with `--user-data-dir=<scratch copy>`.
- **Bug fixes are test-first**: write a failing vitest test, then fix. Extract a pure function if the logic is buried in a component. `npm test`, `npm run typecheck` and `npx electron-vite build` must all pass before you commit.
- **Minimum code.** No new dependencies unless the ticket names one. No speculative abstraction. Touch only the files your ticket owns; if you must touch another, keep the hunk tiny and say so in your report.
- **Deliberate shortcuts** get a `// ponytail: <ceiling>, <upgrade path>` comment.
- Do not `git push` or `git merge` (blocked in this repo). Commit on your ticket branch only.

## Design brief (applies to T8, T9, T10)

Direction: the existing "Midnight Linear" plan (`docs/plans/2026-02-26-midnight-linear-reskin.md`), applied consistently, across all seven palettes via the existing `--c-*` CSS variables.

- **One language.** Sentence case everywhere. No uppercase labels or headings, no neon outlined chips, no text-only primary buttons, no "DEL".
- **Buttons.** Primary = filled, using the `--c-save-btn-*` tokens (never white text on the accent colour). Secondary = ghost. Destructive = red, only inside a destructive confirmation.
- **Tag chip.** One component used on cards, in both modals, in the filter bar and the tag manager. Selected = tinted fill in the tag colour; unselected = muted outline.
- **Surfaces.** `body` background is `--c-bg` for the active palette. The header is never darker than the page. Cards: 10px radius, soft shadow, no border. Controls: 8px radius.
- **Type.** System font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif`), no network font fetch. Body 13px minimum, meta text 11px minimum.
- **Contrast.** Every text token is at least 4.5:1 against the surface it sits on, in all seven palettes. Enforced by a vitest test over the palette table.
- **Window.** `titleBarStyle: 'hiddenInset'`; the header is the drag region (buttons are no-drag), with room for the traffic lights; the board is full-bleed (no inset frame, no second "Kanban" title).
- **Motion.** No fade on launch. Respect `prefers-reduced-motion`.

Theme tokens (`src/renderer/theme/*`, `global.css`) are owned by T8. T9 and T10 use existing tokens only.

---

## Tickets

Wave 1 runs in parallel from the foundation commit. Wave 2 runs in parallel after wave 1 is integrated.

### Wave 1

#### T2 — Shared store and live reload
Owns: new `src/store.js`; in `src/main.js` only `loadData`/`saveData`, the file watcher and the `load-data`/`save-data` handlers; in `src/mcp-server.mjs` only its load/save functions; the load, save and reload effects in `src/renderer/state/AppContext.tsx`.

- `src/store.js` (CommonJS, used by both main and the MCP server): strict `load(path)` — a missing file is an empty board, a parse error throws; atomic `save(path, data)` — write to a pid-suffixed temp file, then rename.
- Watch the data **directory**, not the file (rename replaces the inode). When `kanban-data.json` changes and its content differs from what the app last loaded or saved, send `data-changed-external`. Replace the `ignoreNextChange` flag with that content comparison. Keep the existing "new task added" notification.
- Stale-write guard: `save-data` refuses to write when the file on disk differs from what the app last loaded or saved; it triggers a reload instead.
- Renderer: do not save in response to data that came from disk (today it rewrites the file 300 ms after every launch). One migration function shared by load and reload. Flush a pending save on `beforeunload`. A failed save is surfaced (toast or visible error), not swallowed.
- Unreadable data file: `load-data` reports the error; the app shows a one-line error screen with the file path and does not save.
- Tests: store round trip, corrupt file throws, missing file is empty, no temp file left behind, guard refuses a stale write.
- Acceptance (live): with the app open, append a task to the JSON on disk — it appears on the board within 2 s; then edit a task in the UI — the appended task is still in the file.

#### T3 — Drag and drop
Owns: `components/layout/Board.tsx`, `components/board/Column.tsx`, the `MOVE_TASK`/`REORDER_TASKS`/`SET_DATA` cases in `state/reducer.ts`.

- Tag view: dropping on a tag column must never write a tag id (or `__untagged__`) into `status`. Port the legacy behaviour (`src/index.html` around lines 3019 and 3571): assign the target tag, and order within the tag column via `tagSortOrders` (`REORDER_TASKS` with `view: 'tags'` already exists).
- Dropping a card on itself is a no-op. A card can be dropped at the bottom of a column, in the same or another column. Use `arrayMove`.
- On load, any task whose `status` is not `todo`/`doing`/`done` is repaired to `todo`.
- Add dnd-kit's `KeyboardSensor`.
- Tests: pure drop-resolution function covering status view, tag view, self-drop, last position; load repair.
- Acceptance (live): drag a card onto a tag column — its status is unchanged and it gains the tag; drag a card to the bottom of its own column — it lands last.

#### T4 — Keyboard and undo
Owns: `hooks/useKeyboardNav.ts`, the delete/restore cases in `state/reducer.ts`, the shortcut hints in `components/layout/Header.tsx`.

- Shortcuts ignore events with meta/ctrl/alt held, and do nothing while any dialog is open (edit, quick add, tag manager, summaries, confirm, command palette) or while focus is in an input.
- `x` (and the mouse delete) deletes with an "Undo" toast instead of deleting irreversibly; undo restores the task in place.
- Navigation follows what is on screen: up/down within the visible column order, left/right to the adjacent column, in both status and tag view. The focused card scrolls into view.
- New keys: `1`/`2`/`3` move the focused card to To do / In progress / Done.
- Tests: pure navigation function (given columns of ids, focused id and a key, return the next id); reducer delete then restore.
- Acceptance (live): first `j` focuses the top card of the first column; `x` then Undo restores the task; Cmd+X does nothing.

#### T5 — Dates, summaries and the global hotkey
Owns: `components/task/TaskBadges.tsx`, new `utils/date.ts`, in `src/main.js` only the reminder/summary/scheduler code and the `globalShortcut` registration.

- Due labels: port the legacy logic (`src/index.html` lines 1800–1815). Due today reads "today", yesterday reads "1d overdue" with overdue styling, tomorrow reads "tomorrow". Parse `YYYY-MM-DD` as a local date. Use the already-computed due-soon styling.
- Main process: one local-date helper. The daily summary is named for the local date and counts tasks completed on that local date. Overdue checks compare date strings.
- Scheduler catch-up: if it is past the summary time and today's summary file does not exist, write it (covers a Mac that was asleep at 9pm).
- Global quick-add hotkey moves off Cmd+T to `Control+Option+K`; check the registration result and log a failure. In-app `Cmd+N` opens quick add.
- Tests: due-label function at today, yesterday, tomorrow, +7d; local date helper; "completed today" predicate.
- Acceptance (live): a task due today shows "today"; Cmd+T is no longer registered globally.

#### T6 — Edit window and attachments
Owns: `components/modals/EditTaskModal.tsx`, focus handling in `components/modals/QuickAddModal.tsx`, `components/shared/AttachmentGrid.tsx`, in `src/main.js` only the summary/image/file IPC handlers.

- Cmd+Enter saves. Closing with Escape or an overlay click saves too; "Cancel" is the explicit discard.
- Title is an auto-growing multi-line field that shows the whole title. Add a status selector. Use Chakra `initialFocusRef` instead of the 100 ms timeout (both modals). The window never exceeds the viewport: body scrolls, footer stays visible.
- Attachments: images show a thumbnail; clicking any attachment opens it with the system default app (new `open-attachment` handler using `shell.openPath`).
- File cleanup: Cancel deletes only files added in this session; Save deletes files that were removed.
- IPC handlers that take a filename (`read-summary`, `load-image`, `delete-image`, `open-attachment`) reject anything where `path.basename(name) !== name`.
- Tests: filename guard; the attachment cleanup decision as a pure function.
- Acceptance (live): edit a title, press Escape, reopen — the edit is there; Cmd+Enter saves and closes.

### Wave 2

#### T7 — Agent-friendly MCP server
Owns: `src/mcp-server.mjs`, new `src/shared/task-rules.mjs`, the status-transition code in `state/reducer.ts`; adds `zod` to `dependencies`.

- One shared transition function (timestamps, `timeSpent`, `sortOrder`) used by both the reducer and the MCP server, matching the app's current rules.
- Nine tools, registered with `registerTool`, read tools marked `readOnlyHint`, delete marked `destructiveHint`:
  `board_summary`, `list_tasks` (compact rows: id, title, status, due, tag names; filters `status` (default open), `tag` by name, `query`, `due_before`, `limit`), `get_task`, `add_task`, `update_task`, `move_task`, `delete_task`, `list_tags`, `read_summary`.
- Tags are accepted and returned by **name**; an unknown tag is an error listing the valid names. `due` is validated as `YYYY-MM-DD`. Compact JSON, no pretty-printing.
- Data dir overridable with `KANBAN_DATA_DIR`.
- Tests: run each tool against a scratch data dir; `list_tasks` default output for the 58-task fixture is under 6,000 characters.

#### T8 — Window shell and theme
Owns: `BrowserWindow` options in `src/main.js`, `App.tsx`, `main.tsx`, `index.html`, `components/layout/Header.tsx`, everything in `theme/`, `global.css`, dependency removals in `package.json`.

- Design brief: surfaces, type, contrast, window, motion. Palette page background actually applied. Status dots visible.
- First run follows system light/dark; an explicit palette choice still wins. Palette picker closes on Escape and supports arrow keys.
- Remove `@saas-ui/react` and `react-hook-form`. Remove the Google Fonts import. Add a Content-Security-Policy meta tag that allows only local content.
- Header works down to 560 px wide (controls collapse rather than overflow). One "Tags" control, not two with the same label.
- Tests: contrast test over all seven palettes (every text token ≥ 4.5:1 on its surface).

#### T9 — One style for every window
Owns: `components/modals/*` (styling only in `EditTaskModal.tsx`), `components/shared/ConfirmDialog.tsx`, `components/shared/TagSelector.tsx`, `components/shared/CommandPalette.tsx`, `components/layout/FilterBar.tsx`.

- Design brief: one language, buttons, tag chip. Quick add, edit, tag manager, confirm and summaries all share it.
- Tag manager can rename and recolour a tag (`UPDATE_TAG` exists but is never dispatched).
- Summary viewer renders headings and bullet lists instead of raw markdown (a small local formatter; no markdown dependency).
- Command palette: besides task search, offer actions (new task, switch view, open tags, open summaries, switch palette) and tag filters.
- Filter bar: label the age chips; tag filter chips use the shared chip.

#### T10 — Board and cards
Owns: `state/AppContext.tsx` (context shape only), `components/task/*`, `components/board/*` except drag logic, layout in `components/layout/Board.tsx`.

- Stop whole-board re-renders: split state and dispatch contexts (or pass props) so `memo` on `TaskCard` works; one shared confirm dialog instead of one per card.
- Cards per the design brief and the reskin plan. Double-click a title to edit it inline. To-do cards get a "start" quick action; quick actions never cover the title.
- Done column shows the 10 most recently completed tasks with a "Show all (N)" toggle.
- New inline-added task is scrolled into view. A loading state replaces the "No tasks" flash.
- Layout: columns have a sensible minimum width and the board scrolls horizontally below it; tag-view columns size to the window instead of a fixed 300 px.

#### T11 — Docs and dead code
Owns: `CLAUDE.md`, `README.md`, `FAQ.md`, `GETTING-STARTED.md`, `RELEASE-NOTES.md`; deletes `src/index.html`.

- Rewrite to describe the app this spec produces: React renderer, `npm start`/`npm run dev`/`npm test`/`npm run typecheck`, real data path, the MCP server and how to register it for Claude Code, Claude Desktop and Codex, the new hotkeys.
- Delete `src/index.html`.

### Backlog (not in this pass)

- **T12 — Electron hardening.** Upgrade Electron from 28, `contextIsolation: true`, a `contextBridge` preload, `sandbox: true`. Deferred: the app loads no remote content once T8 removes Google Fonts.
- Time badges show elapsed calendar time rather than work time.
- Single-instance lock; separate data dir for dev runs; card attachment thumbnails; deleting a task's attachment files when the task is deleted.
