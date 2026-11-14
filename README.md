# Kanban Board

A local-first, privacy-focused Kanban board desktop app for macOS. No cloud, no accounts, no telemetry. Your data stays on your machine.

Built with Electron and React.

## What It Does

A simple three-column Kanban board (To Do → In Progress → Done) with:

- **Drag & drop** task management
- **Due dates** with visual urgency indicators
- **Tags** for organizing and filtering tasks
- **Time tracking** (automatic when tasks are in progress)
- **Keyboard navigation** and a command palette (Cmd+K)
- **Periodic reminders** via system notifications during work hours
- **Daily summaries** auto-generated as markdown files
- **An MCP server** so Claude and Codex can read and update the same board

## Screenshots

```
┌─────────────────────────────────────────────────────────────────┐
│  Kanban                          [Filters] [Tags] [Summaries]   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─ To do ─────┐  ┌─ In progress ─┐  ┌─ Done ──────┐           │
│  │             │  │               │  │             │           │
│  │  Task 1     │  │  Task 3       │  │  Task 5     │           │
│  │  [tag]      │  │  [tag]        │  │  [tag]      │           │
│  │  tomorrow   │  │  jan 20       │  │  1h 30m     │           │
│  │             │  │               │  │             │           │
│  │  Task 2     │  │               │  │  Task 6     │           │
│  │  [tag]      │  │               │  │  [tag]      │           │
│  │  2d overdue │  │               │  │  45m        │           │
│  └─────────────┘  └───────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture

```
kanban-app/
├── src/
│   ├── main.js          # Electron main process
│   │                    # - Window management
│   │                    # - Data persistence (JSON file) and file watcher
│   │                    # - System notifications & scheduler
│   │                    # - Daily summary generation
│   │                    # - IPC handlers for renderer
│   │                    # - Global hotkey (Control+Option+K for quick add)
│   │
│   ├── store.js         # Data file load / atomic save,
│   │                    # shared by main.js and the MCP server
│   │
│   ├── shared/
│   │   └── task-rules.mjs   # Status-change rules (timestamps, time spent),
│   │                        # shared by the app and the MCP server
│   │
│   ├── mcp-server.mjs   # MCP server for Claude and Codex
│   │
│   └── renderer/        # React frontend (TypeScript, Chakra UI, dnd-kit)
│       ├── index.html, main.tsx, App.tsx
│       ├── state/       # Reducer, context, selectors, types
│       ├── components/  # layout/, board/, task/, modals/, shared/
│       ├── hooks/       # IPC wrapper, keyboard navigation
│       ├── theme/       # Chakra theme and the seven palettes
│       └── utils/       # Date and colour helpers
│
├── assets/
│   └── icon.icns        # App icon for macOS
│
├── electron.vite.config.ts  # Build config (output in dist/)
├── package.json         # Dependencies & packaging config
└── README.md
```

### Data Flow

```
┌──────────────────┐     IPC      ┌──────────────────┐
│   Renderer       │ ◄──────────► │   Main Process   │
│   (React)        │              │   (main.js)      │
│                  │              │                  │
│  - UI rendering  │  load-data   │  - File I/O      │
│  - User input    │  save-data   │  - Notifications │
│  - Drag & drop   │  get-paths   │  - Scheduling    │
│                  │  gen-summary │  - Summaries     │
└──────────────────┘              └──────────────────┘
                                          │
                                          ▼
                                  ┌──────────────────┐
                                  │  File System     │
                                  │                  │
                                  │  ~/Library/      │
                                  │  Application     │
                                  │  Support/        │
                                  │  kanban-app/     │
                                  │  ├─ kanban-data  │
                                  │  │    .json      │
                                  │  ├─ images/      │
                                  │  └─ summaries/   │
                                  └──────────────────┘
```

The MCP server (`src/mcp-server.mjs`) reads and writes the same data file directly, without going through the app. Both sides write atomically (temp file, then rename). The app watches the folder and reloads when the file changes, and it refuses to save over a change it has not loaded yet.

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Main Process | `src/main.js` | Electron backend - handles data, notifications, summaries |
| Renderer | `src/renderer/` | Frontend UI - React 19, Chakra UI 2, dnd-kit, TypeScript |
| Data store module | `src/store.js` | Loads and atomically saves the data file; used by the main process and the MCP server |
| Task rules | `src/shared/task-rules.mjs` | Status-change rules shared by the app and the MCP server |
| MCP server | `src/mcp-server.mjs` | Lets Claude and Codex read and update the board |
| Data Store | `~/Library/Application Support/kanban-app/kanban-data.json` | JSON file with tasks and tags |
| Attachments | `~/Library/Application Support/kanban-app/images/` | Attached files (any type) |
| Summaries | `~/Library/Application Support/kanban-app/summaries/` | Daily markdown summary files |

## Features in Detail

### Tags & Filtering
- Create colored tags to categorize tasks; rename or recolor them in the tag manager
- Filter by one or more tags (a task is shown if it has any of the selected tags)
- Filter by age: show only tasks created in the last day, 3 days, week, 2 weeks or month
- Assign tags in the edit window, in Quick Add, or by dragging a card onto a tag column in Tags view
- Quick Add (Cmd+N) includes tag selection

### Time Tracking
- Automatic: the time between moving a task to "In Progress" and moving it to "Done" is recorded (elapsed clock time)
- Displayed on the card
- Included in daily summaries with percentages

### Reminders
- System notifications every 30 minutes during work hours (8am-5pm)
- Shows current task counts and overdue warnings
- Click notification to focus the app

### Daily Summaries
- Auto-generated at 9pm as markdown files (if the Mac was asleep at 9pm, the summary is written when the app next checks that evening)
- Includes: completed today, in progress, overdue, tomorrow's priorities
- Per-tag breakdown with task counts and time spent
- Manual generation available from the Summaries window

## Installation

### Prerequisites

- **Node.js** (v22.12 or later) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **macOS** (app is Mac-focused, but Electron works cross-platform)

### Option 1: Run from Source (Development)

```bash
# Clone the repo
git clone <repo-url> kanban-app
cd kanban-app

# Install dependencies
npm install

# Build and run the app
npm start
```

The app will launch. Your data persists between runs. For development with hot reload, use `npm run dev` instead.

### Option 2: Build & Install as Mac App

```bash
# Clone and install
git clone <repo-url> kanban-app
cd kanban-app
npm install

# Build the .app bundle and DMG (output goes to release/)
npm run build

# Copy to Applications folder
cp -r release/mac-arm64/Kanban.app /Applications/

# For Intel Macs, use:
# cp -r release/mac/Kanban.app /Applications/
```

Now you can launch "Kanban" from Spotlight or Applications. The installed app and a run from source use the same data folder.

### Keyboard Shortcuts

**Control+Option+K** opens Quick Add from anywhere (when app is running).

On the board:

| Shortcut | Action |
|----------|--------|
| Arrow keys or `h` `j` `k` `l` | Move focus between cards and columns |
| Enter | Edit the focused task |
| `d` | Mark the focused task done (on a task that is already done, move it back to To Do) |
| `x` | Delete the focused task (an Undo toast restores it) |
| `1` / `2` / `3` | Move the focused task to To do / In progress / Done |
| Cmd+K | Command palette: search tasks, run actions, filter by tag |
| Cmd+N | Quick Add |

In the edit window: **Cmd+Enter** saves, **Escape** saves and closes, **Cancel** discards the changes.

## Data Storage

All data is stored locally in:

```
~/Library/Application Support/kanban-app/
├── kanban-data.json    # Tasks and tags
├── images/             # Attachments (any file type)
└── summaries/
    ├── summary-2025-01-15.md
    ├── summary-2025-01-16.md
    └── ...
```

### Data Format

```json
{
  "tasks": [
    {
      "id": "abc123",
      "title": "Task title",
      "description": "Longer notes",
      "status": "todo|doing|done",
      "dueDate": "2025-01-20",
      "tags": ["tag-id-1", "tag-id-2"],
      "attachments": [
        { "filename": "1707500000_abc123.png", "originalName": "screenshot.png", "type": "image/png" }
      ],
      "createdAt": "2025-01-15T10:00:00.000Z",
      "startedAt": "2025-01-16T09:00:00.000Z",
      "completedAt": "2025-01-16T12:00:00.000Z",
      "timeSpent": 10800000,
      "sortOrder": 0,
      "tagSortOrders": { "tag-id-1": 0 }
    }
  ],
  "tags": [
    {
      "id": "tag-id-1",
      "name": "Work",
      "color": "#ff6b6b"
    }
  ]
}
```

### Backup

Your data is just JSON plus the attachment files. Back up the whole folder however you like:

```bash
cp -R ~/Library/Application\ Support/kanban-app ~/Dropbox/backup/
```

## Use it from Claude and Codex

The repo includes an MCP server (`src/mcp-server.mjs`) that lets Claude Code, Claude Desktop and Codex read and update the board. It works on the same data file as the app, so a task an agent adds shows up in the open app within a couple of seconds. The app does not need to be running.

### Tools

| Tool | What it does |
|------|--------------|
| `board_summary` | Short overview of the board |
| `list_tasks` | Compact task rows (id, title, status, due, tag names). Filters: `status` (defaults to open tasks), `tag` (by name), `query`, `due_before`, `limit` |
| `get_task` | Full details of one task |
| `add_task` | Create a task |
| `update_task` | Change a task's fields |
| `move_task` | Change a task's status, with the same time-tracking rules as the app |
| `delete_task` | Delete a task |
| `list_tags` | List the tags |
| `read_summary` | Read a daily summary |

Tags are given and returned by name; an unknown tag name is an error that lists the valid names. Due dates are `YYYY-MM-DD`.

### Registration

Run `npm install` in the repo first (the server needs its dependencies). Use an absolute path to `node`: GUI apps do not inherit your shell `PATH`. `which node` shows yours. Adjust the repo path if your clone lives somewhere other than `/Applications/kanban-app`.

Claude Code:

```bash
claude mcp add --scope user kanban -- /usr/local/bin/node /Applications/kanban-app/src/mcp-server.mjs
```

Codex:

```bash
codex mcp add kanban -- /usr/local/bin/node /Applications/kanban-app/src/mcp-server.mjs
```

or the equivalent in `~/.codex/config.toml`:

```toml
[mcp_servers.kanban]
command = "/usr/local/bin/node"
args = ["/Applications/kanban-app/src/mcp-server.mjs"]
```

Claude Desktop: add this entry inside the top-level `{ }` of `~/Library/Application Support/Claude/claude_desktop_config.json` (if the file already has an `mcpServers` object, add `kanban` to it instead), then restart Claude Desktop:

```json
"mcpServers": { "kanban": { "command": "/usr/local/bin/node", "args": ["/Applications/kanban-app/src/mcp-server.mjs"] } }
```

### Using a different data folder

The server reads `~/Library/Application Support/kanban-app/` by default. Set the `KANBAN_DATA_DIR` environment variable to point it at another folder, for example a scratch copy for testing.

## Configuration

Edit `src/main.js` (and `src/dates.js` for the summary time) to customize, then restart the app:

| Setting | Default | Location |
|---------|---------|----------|
| Work hours start | 8am | `isWorkHours()` function |
| Work hours end | 5pm | `isWorkHours()` function |
| Reminder frequency | 30 min | `setupScheduler()` - checks at :00 and :30 |
| Summary generation time | 9pm | `SUMMARY_HOUR` in `src/dates.js` |

## Development

```bash
# Run in development with hot reload
npm run dev

# Build, then launch
npm start

# Tests and type check
npm test
npm run typecheck

# Package for distribution (DMG in release/)
npm run build
```

### Tech Stack

- **Electron 28** - Desktop app framework
- **React 19 + TypeScript** - Frontend
- **Chakra UI 2** - UI components
- **dnd-kit** - Drag & drop
- **electron-vite** - Build and dev server
- **vitest** - Tests
- **electron-builder** - Packaging
- **Model Context Protocol SDK** - MCP server

## Tips

- **Closing the window does not quit**: The window hides and the app keeps running in the background for notifications and the global hotkey. Cmd+Q to fully quit.
- **Quick capture**: Control+Option+K from anywhere to add a task fast
- **Check summaries**: Great for standups or weekly reviews

## License

MIT
