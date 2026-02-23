# Kanban App

Local-first Electron kanban board with reminders and daily summaries.

## Quick Start

```bash
cd /Applications/kanban-app && npm start
```

## Architecture

Single-file vanilla JS Electron app — no frameworks, no bundler.

- `src/index.html` (~3000 lines) — all CSS, HTML, and JS in one file
- `src/main.js` (~470 lines) — Electron main process, IPC handlers, scheduling
- `package.json` — Electron 28, electron-builder for macOS DMG

## Data Storage

All in `~/Library/Application Support/Kanban/`:
- `kanban-data.json` — `{ tasks[], tags[] }`
- `images/` — attachment files (any type), referenced by filename
- `summaries/` — daily summary files

## Data Model

- **Tasks**: id, title, description, status (`todo`/`doing`/`done`), dueDate (`YYYY-MM-DD`), tags[], attachments[], createdAt, startedAt, completedAt, timeSpent, sortOrder, tagSortOrders
- **Tags**: id, name, color
- **Attachments**: `{ filename, originalName, type }` — filename on disk, display name, MIME type
- Dates are local `YYYY-MM-DD` strings (not UTC) — use `formatDateToISO()`/`parseLocalDate()`

## Key Patterns

- Global state variables: `tasks`, `tags`, `editingTaskId`, `editingTaskImages`, `activeFilters`, `currentView`
- Save flow: mutate state → `saveData()` via IPC → `renderBoard()` re-renders everything
- Two views: `renderStatusView()` and `renderTagView()`, toggled via `currentView`
- Event handlers re-initialized every render in `initStatusViewEvents()`/`initTagViewEvents()`
- flatpickr instances tracked in `datePickers[]` — must destroy before re-render to prevent leaks
- `sortOrder` is per-status-column; `tagSortOrders` is per-tag-column (independent)

## IPC Channels (renderer ↔ main)

- `save-data` / `load-data` — persist/load full data object
- `save-image` — base64 data URI → file on disk
- `save-file` — base64 + metadata → file on disk
- `load-image` — filename → base64 data URI
- `delete-image` — remove file from disk

## Important Gotchas

- flatpickr instances leak if not destroyed before re-render
- Tasks can appear in multiple tag columns (multi-tag)
- `closeEditModal()` deletes orphaned attachments — `saveEdit()` must update `task.attachments` BEFORE calling it
- Legacy `task.images` (string[]) and `task.content` auto-migrated on load
- Drag-and-drop: `handleDragEnd` always fires after `drop` — use it for cleanup

## Code Style

- No external UI libraries — vanilla JS only
- All UI code lives in `index.html` (styles in `<style>`, markup in `<body>`, logic in `<script>`)
- Use existing naming conventions (camelCase functions, descriptive variable names)
- Keep the single-file structure — don't split into separate JS/CSS files
