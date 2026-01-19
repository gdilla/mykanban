# Kanban Board

A local-first, privacy-focused Kanban board desktop app for macOS. No cloud, no accounts, no telemetry. Your data stays on your machine.

Built with Electron.

## What It Does

A simple three-column Kanban board (To Do → In Progress → Done) with:

- **Drag & drop** task management
- **Due dates** with visual urgency indicators
- **Tags** for organizing and filtering tasks
- **Time tracking** (automatic when tasks are in progress)
- **Task age tracking** to identify stale items
- **Periodic reminders** via system notifications during work hours
- **Daily summaries** auto-generated as markdown files

## Screenshots

```
┌─────────────────────────────────────────────────────────────────┐
│  KANBAN BOARD                    [Filters] [Tags] [Summary]     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─ TO DO ─────┐  ┌─ IN PROGRESS ─┐  ┌─ DONE ──────┐           │
│  │             │  │               │  │             │           │
│  │  Task 1     │  │  Task 3       │  │  Task 5     │           │
│  │  [tag] [+]  │  │  [tag] [+]    │  │  [tag] [+]  │           │
│  │  5d old     │  │  Due: Jan 20  │  │  1h 30m     │           │
│  │             │  │               │  │             │           │
│  │  Task 2     │  │               │  │  Task 6     │           │
│  │  [+]        │  │               │  │  [tag] [+]  │           │
│  │  12d old    │  │               │  │  45m        │           │
│  └─────────────┘  └───────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture

```
kanban-app/
├── src/
│   ├── main.js          # Electron main process
│   │                    # - Window management
│   │                    # - Data persistence (JSON file)
│   │                    # - System notifications & scheduler
│   │                    # - Daily summary generation
│   │                    # - IPC handlers for renderer
│   │                    # - Global hotkey (Cmd+T for quick add)
│   │
│   └── index.html       # Single-file frontend (HTML + CSS + JS)
│                        # - Kanban board UI
│                        # - Drag & drop handling
│                        # - Tag management
│                        # - Filtering & sorting
│                        # - Modals (edit, quick add, etc.)
│
├── assets/
│   └── icon.icns        # App icon for macOS
│
├── package.json         # Dependencies & build config
└── README.md
```

### Data Flow

```
┌──────────────────┐     IPC      ┌──────────────────┐
│   Renderer       │ ◄──────────► │   Main Process   │
│   (index.html)   │              │   (main.js)      │
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
                                  │  ├─ data.json    │
                                  │  └─ summaries/   │
                                  └──────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Main Process | `src/main.js` | Electron backend - handles data, notifications, summaries |
| Renderer | `src/index.html` | Frontend UI - single HTML file with embedded CSS/JS |
| Data Store | `~/Library/Application Support/kanban-app/kanban-data.json` | JSON file with tasks and tags |
| Summaries | `~/Library/Application Support/kanban-app/summaries/` | Daily markdown summary files |

## Features in Detail

### Tags & Filtering
- Create colored tags to categorize tasks
- Filter by multiple tags (AND logic)
- Click `+` on any task to quickly add tags
- Quick Add modal (Cmd+T) includes tag selection

### Task Age & Staleness
- To Do tasks show age in days (e.g., "5d old")
- Tasks 30+ days old get highlighted as "stale"
- Filter to show only tasks older than N days
- Sort by age to surface forgotten items

### Time Tracking
- Automatic: time tracked while task is "In Progress"
- Displayed on completed tasks
- Included in daily summaries with percentages

### Reminders
- System notifications every 30 minutes during work hours (8am-5pm)
- Shows current task counts and overdue warnings
- Click notification to focus the app

### Daily Summaries
- Auto-generated at 9pm as markdown files
- Includes: completed today, in progress, overdue, tomorrow's priorities
- Per-tag breakdown with task counts and time spent
- Manual generation available via "Summary" button

## Installation

### Prerequisites

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **macOS** (app is Mac-focused, but Electron works cross-platform)

### Option 1: Run from Source (Development)

```bash
# Clone the repo
git clone <repo-url> kanban-app
cd kanban-app

# Install dependencies
npm install

# Run the app
npm start
```

The app will launch. Your data persists between runs.

### Option 2: Build & Install as Mac App

```bash
# Clone and install
git clone <repo-url> kanban-app
cd kanban-app
npm install

# Build the .app bundle
npm run build

# Copy to Applications folder
cp -r dist/mac-arm64/Kanban.app /Applications/

# For Intel Macs, use:
# cp -r dist/mac/Kanban.app /Applications/
```

Now you can launch "Kanban" from Spotlight or Applications.

### Global Hotkey

**Cmd+T** opens Quick Add from anywhere (when app is running).

## Data Storage

All data is stored locally in:

```
~/Library/Application Support/kanban-app/
├── kanban-data.json    # Tasks and tags
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
      "content": "Task description",
      "status": "todo|doing|done",
      "dueDate": "2025-01-20",
      "tags": ["tag-id-1", "tag-id-2"],
      "createdAt": "2025-01-15T10:00:00.000Z",
      "startedAt": "2025-01-16T09:00:00.000Z",
      "completedAt": "2025-01-16T12:00:00.000Z",
      "timeSpent": 10800000
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

Your data is just JSON. Back it up however you like:

```bash
cp ~/Library/Application\ Support/kanban-app/kanban-data.json ~/Dropbox/backup/
```

## Configuration

Edit `src/main.js` to customize:

| Setting | Default | Location |
|---------|---------|----------|
| Work hours start | 8am | `isWorkHours()` function |
| Work hours end | 5pm | `isWorkHours()` function |
| Reminder frequency | 30 min | `setupScheduler()` - checks at :00 and :30 |
| Summary generation time | 9pm | `setupScheduler()` - hour === 21 |
| Stale task threshold | 30 days | `index.html` - `ageDays >= 30` |

## Development

```bash
# Run in development
npm start

# Build for distribution
npm run build
```

### Tech Stack

- **Electron 28** - Desktop app framework
- **Vanilla JS** - No frontend framework
- **Flatpickr** - Date picker
- **electron-builder** - Packaging

## Tips

- **Minimize, don't close**: The app runs in background for notifications. Cmd+Q to fully quit.
- **Quick capture**: Cmd+T from anywhere to add a task fast
- **Review stale tasks**: Use the age filter to find forgotten items
- **Check summaries**: Great for standups or weekly reviews

## License

MIT
