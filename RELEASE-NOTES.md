# Release Notes

## Overhaul — November 2026

The app is now React only, shares its data file safely with AI agents, and has one consistent look. Full detail: `docs/specs/2026-11-14-kanban-overhaul.md`.

### Running and packaging

- `npm start` builds and launches the app. `npm run dev` runs it with hot reload. `npm run build` packages a DMG into `release/`.
- `npm test` (vitest) and `npm run typecheck` added.
- The legacy single-file UI (`src/index.html`) is deleted. The renderer is `src/renderer/` (React 19, Chakra UI 2, dnd-kit).

### Working with AI agents

- **MCP server** — `src/mcp-server.mjs` gives Claude Code, Claude Desktop and Codex nine compact tools: `board_summary`, `list_tasks`, `get_task`, `add_task`, `update_task`, `move_task`, `delete_task`, `list_tags`, `read_summary`. Tags are given by name. `KANBAN_DATA_DIR` points it at another data folder. Setup is in `README.md`.
- **Live reload** — A change an agent writes to the data file shows up in the open app within a couple of seconds.
- **No lost writes** — Saves are atomic (temp file, then rename), and the app refuses to save over a change it has not loaded; it reloads instead.
- **Corrupt data file** — The app shows an error with the file path instead of an empty board, and does not save over the file.

### Drag, keyboard and dates

- **Tag view drag** — Dropping a card on a tag column assigns that tag and no longer changes its status. Cards can be dropped at the bottom of a column. Cards can be dragged from the keyboard.
- **Keyboard** — Arrow keys or `h`/`j`/`k`/`l` follow what is on screen in both views. `1`/`2`/`3` move the focused task to To do / In progress / Done. `x` deletes with an Undo toast instead of deleting for good. Shortcuts are ignored while a window is open or a modifier key is held.
- **Quick add hotkeys** — The global hotkey moved from Cmd+T to Control+Option+K. Cmd+N opens quick add inside the app.
- **Due labels** — A task due today reads "today", due yesterday reads "1d overdue", due tomorrow reads "tomorrow". Dates are handled as local dates.
- **Daily summary** — Named for and counted by the local date. If the Mac was asleep at 9pm, the summary is written when the app next checks.

### Edit window and attachments

- Cmd+Enter saves. Escape or a click outside saves too. Cancel discards.
- Multi-line title, status selector, and the window never grows past the screen.
- Clicking an attachment opens it in its default app.

### Look

- One visual language across the board and every window, readable in all seven palettes, with a native Mac title bar and the system font (no network font fetch).
- First run follows the system light/dark setting.
- Tag manager can rename and recolor tags. The summary viewer renders headings and lists. The command palette (Cmd+K) offers actions and tag filters as well as task search.
- The Done column shows the 10 most recently completed tasks with a "Show all" toggle.

### Removed

These were in the original single-file app and in earlier versions of these notes. They are not in the React app:

- Attachment thumbnails on cards and the fullscreen image lightbox (cards show an attachment count; attachments open in their default app)
- The "+" tag button on cards
- The inline due-date picker on cards
- The pulsing live-timer badge
- Age badges, the "stale" highlight, sort by age, and the "older than N days" filter (the age filter now shows recently created tasks)
- Automatic resizing of pasted images
- Data paths shown in the filter bar

---

## v1.0.0 — February 2026

First release of the local-first Kanban board for macOS. The notes below were corrected in November 2026 to describe the app as it is now; see "Removed" above for what was dropped.

---

### Board & Views

- **Three-column status board** — To Do, In Progress, and Done columns, each with a colored status dot in the header
- **Tag view** — Switch to a tag-based layout where each tag gets its own column. Tasks with multiple tags appear in multiple columns. An "Untagged" column collects tasks without tags.
- **View toggle** — Switch between Status and Tags views using header buttons. Selection persists across sessions.
- **Task counts** — Each column header shows the number of visible (filtered) tasks

### Task Management

- **Title and description** — Every task has a required title and optional long-form description. Cards show a two-line description preview.
- **Due dates** — Set in Quick Add or the edit window.
- **Tags** — Create custom tags with names and colors via the Tag Manager. Assign multiple tags per task.
- **Drag-and-drop reordering** — Drag tasks vertically within a column to set priority. Cards move aside to show the insertion point. Sort order is saved automatically.
- **Drag-and-drop status changes** — In Status view, drag a task to a different column to change its status. In Tag view, drag to a different column to assign that tag.
- **Independent sort orders** — Status view and Tag view maintain completely separate orderings. Reordering in one view does not affect the other. Tag view ordering is per-tag-column (a task can have a different position in each tag column it belongs to).
- **Delete with undo** — Hover a card to reveal the delete button, or press `x` on the focused card. An Undo toast restores the task.

### File Attachments

- **Paste images** — In the edit modal, paste screenshots or images from the clipboard with Cmd+V.
- **Attach any file** — Click "Attach files" in the edit modal to open a file picker. Supports any file type (PDFs, documents, archives, etc.).
- **Attachment count on cards** — Cards with attachments show a paperclip badge with the count.
- **Open attachments** — In the edit modal, images show a thumbnail and other files show their name. Click any attachment to open it in its default app.
- **Safe editing** — Removing an attachment in the edit modal doesn't delete the file until you click Save. Canceling restores the original state. Newly pasted files that aren't saved are automatically cleaned up.

### Time Tracking

- **Automatic time tracking** — Moving a task to "In Progress" records the start time. Moving it to "Done" adds the elapsed time to its total. Time persists across sessions.
- **Time spent badge** — Tasks with recorded time show the total (e.g., "2h 15m").

### Filtering & Sorting

- **Tag filters** — Click tags in the filter bar to show only tasks that have at least one of the selected tags. The Clear button resets.
- **Age filter** — Show only tasks created in the last day, 3 days, week, 2 weeks or month.
- **Filter bar** — Collapsible panel toggled from the header.

### Quick Add

- **Global hotkey** — Press Control+Option+K from anywhere (even when the app is in the background) to open the Quick Add modal. Inside the app, Cmd+N does the same.
- **Full control** — Set title, description, due date, status (To Do / In Progress / Done), and tags all from the quick add form.
- **Enter to submit** — Press Enter to add the task without clicking the button.

### Reminders & Summaries

- **Work-hours reminders** — Desktop notifications every 30 minutes between 8am and 5pm showing task counts and overdue warnings. Click the notification to bring the app to focus.
- **Daily summaries** — Auto-generated at 9pm as markdown files. Includes: tasks completed today, time breakdown with percentages, in-progress tasks, overdue warnings, tomorrow's priorities, and per-tag breakdowns.
- **Summary viewer** — Browse all historical summaries from the "Summaries" button in the header. Two-pane layout: date list on the left, content on the right.
- **Manual trigger** — Generate a summary on demand from the Summaries window.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Control+Option+K | Open Quick Add (global) |
| Cmd+N | Open Quick Add (in the app) |
| Cmd+K | Command palette |
| Arrow keys or `h` `j` `k` `l` | Move focus between cards and columns |
| Enter | Edit the focused task; submit forms (add task, quick add, new tag) |
| `d` | Mark the focused task done (on a task that is already done, move it back to To Do) |
| `x` | Delete the focused task, with Undo |
| `1` / `2` / `3` | Move the focused task to To Do / In Progress / Done |
| Cmd+Enter | Save in the edit window |
| Escape | In the edit window: save and close (Cancel discards). Elsewhere: close the open window |

### Data & Storage

- **Local-first** — All data stored on your machine. No accounts, no cloud, no sync.
- **Task data** — `~/Library/Application Support/kanban-app/kanban-data.json`
- **Attachments** — `~/Library/Application Support/kanban-app/images/` (any file type, despite the directory name)
- **Summaries** — `~/Library/Application Support/kanban-app/summaries/summary-YYYY-MM-DD.md`
- **Auto-migration** — Legacy data formats are automatically upgraded on launch (no manual steps needed).
- **Runs in the background** — Closing the window hides the app instead of quitting. The app stays running for reminders and the global hotkey. There is no tray icon; click the Dock icon to bring the window back, Cmd+Q to quit.

### Design

- Seven color palettes (Linear, GitHub Dark, Vercel, Spotify, Slack, Notion, Arc), switchable from the header
- Typography: the system font
- Responsive layout for different window sizes
- Visual due date states: a red badge for overdue, a highlighted date for due soon

### Technical

- Built with Electron 28, React 19 and TypeScript, bundled by electron-vite
- UI components: Chakra UI 2
- Date picker: the native date input
- Drag-and-drop: dnd-kit
- Renderer: `src/renderer/` (components, state, hooks, theme)
- Electron main process: `src/main.js` (IPC handlers, scheduling, notifications)
- MCP server: `src/mcp-server.mjs`
