# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) (v22.12 or later)
- npm (comes with Node.js)

## Installation

```bash
cd /Applications/kanban-app
npm install
npm start
```

`npm start` builds the app and opens it in its own window. Closing the window hides it to the background — use Cmd+Q to fully quit.

For development with hot reload, use `npm run dev` instead.

---

## Your First Task

1. Type a task name in the "Add a task..." field at the bottom of the **To Do** column
2. Press Enter (or click **Add**)

Your task appears as a card in the To Do column. To set a due date, tags or a description while adding, use Quick Add (Cmd+N).

## Editing a Task

Click a card (or focus it with the arrow keys and press Enter) to open the edit window. From here you can change:

- Title and description
- Status
- Due date
- Tags (click to toggle, create new ones in the tag manager)
- Attachments (paste images with Cmd+V, or click "Attach files" for any file type)

Click **Save** (or press Cmd+Enter) when done. Pressing Escape or clicking outside the window also saves. **Cancel** discards your changes.

To change only the title, double-click it on the card and edit it in place.

## Moving Tasks

Drag a card to a different column to change its status:

- **To Do** — Task is waiting
- **In Progress** — Records the start time for time tracking
- **Done** — Records the completion time and adds the elapsed time to the task's total

From the keyboard, focus a card and press `1`, `2` or `3` to move it to To Do, In Progress or Done.

## Reordering Tasks

Drag a card up or down within its column to set priority. The other cards move aside to show where it will land. The new order saves automatically.

---

## Understanding the Board

### Card Anatomy

Each card shows:

- **Status dot** — Small dot before the title, colored by status
- **Title** — At the top
- **Description snippet** — First two lines in lighter text
- **Tags** — Colored chips below the title
- **Badges** — Due date, time tracked, number of attachments
- **Quick actions** — Buttons that appear on hover (start, done, delete)

### Visual States

- **Red "overdue" badge** — Task is overdue (e.g., "1d overdue")
- **Highlighted due date** — Task is due soon (e.g., "today", "tomorrow")
- **Outlined card** — The card has keyboard focus

---

## Views

### Status View (default)

Three columns: To Do | In Progress | Done. Each task appears in exactly one column. Add new tasks from the form at the bottom of a column. The Done column shows the 10 most recently completed tasks; click "Show all" to see the rest.

### Tags View

One column per tag, plus an "Untagged" column. Tasks with multiple tags appear in multiple columns. Each tag column has its own add-task form (creates the task with that tag in To Do status). Cards show a status dot since the column doesn't indicate status. Dragging a card onto a tag column gives it that tag without changing its status.

### Switching Views

Use the Status / Tags switch in the header. Your choice persists between sessions.

### Independent Ordering

Status view and Tags view have completely separate sort orders. Reordering in one view does not affect the other. In Tags view, each tag column has its own independent order.

---

## Attachments

### Pasting Images

1. Open a task for editing (click the card)
2. Copy an image or screenshot to your clipboard
3. Press **Cmd+V** in the edit window
4. A thumbnail appears in the Attachments section
5. Click **Save**

### Attaching Files

1. Open a task for editing
2. Click **Attach files** (in the Attachments section)
3. Select one or more files from the picker
4. Files appear in the Attachments section
5. Click **Save**

Any file type is supported. Images get visual thumbnails; other files show their file name.

### Opening Attachments

In the edit window, click any attachment to open it in its default app. On the board, a card with attachments shows a paperclip badge with the count.

---

## Tags

### Creating Tags

1. Open the tag manager from the header
2. Type a name in the "New tag name" field
3. Pick a color (or use the default)
4. Click **Add** (or press Enter)

You can rename, recolor or delete existing tags in the same window.

### Assigning Tags to Tasks

- **From the edit window:** Click tags to toggle them on/off
- **From Quick Add:** Select tags before adding the task
- **From Tag view:** Add a task from a tag column's form — it's automatically tagged. Or drag an existing card onto a tag column

### Filtering by Tag

Click **Filters** in the header, then click one or more tags. Only tasks with at least one of the selected tags are shown. Click **Clear** to reset.

---

## Time Tracking

Time tracking is automatic:

| Action | Effect |
|--------|--------|
| Move task to In Progress | Start time recorded |
| Move task from In Progress to Done | Elapsed time added to the task's total |
| Move task back to In Progress, then to Done again | The new stretch is added to the total |
| Move task back to To Do | Start time cleared, nothing added |

- **Total time** — Clock badge showing accumulated duration (e.g., "2h 15m")
- Time is elapsed clock time, not active work time
- Time persists across app restarts

---

## Reminders & Summaries

### Reminders

The app sends macOS notifications every 30 minutes during work hours (8am–5pm) with task counts and overdue warnings. Click a notification to bring the app into focus.

Reminders only work while the app is running. The app stays alive in the background when you close the window.

### Daily Summaries

At 9pm, the app auto-generates a markdown summary with completed tasks, time breakdowns, overdue warnings, and tomorrow's priorities.

**View summaries:** Click **Summaries** in the header to browse all past summaries.

**Generate on demand:** Open **Summaries** and use the generate button to create one right now.

**File location:** `~/Library/Application Support/kanban-app/summaries/`

---

## Quick Add (Cmd+N)

Press **Cmd+N** in the app, or **Control+Option+K** from anywhere — even when the app is in the background — to open Quick Add.

Set the title, description, due date, status, and tags all in one form. Press **Enter** or click **Add** to create the task.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Control+Option+K** | Open Quick Add (global — works even when app is in background) |
| **Cmd+N** | Open Quick Add (in the app) |
| **Cmd+K** | Command palette: search tasks, run actions, filter by tag |
| **Arrow keys** or **h / j / k / l** | Move focus between cards and columns |
| **Enter** | Edit the focused task; in a form, submit it |
| **d** | Mark the focused task done (on a task that is already done, move it back to To Do) |
| **x** | Delete the focused task (an Undo toast restores it) |
| **1 / 2 / 3** | Move the focused task to To Do / In Progress / Done |
| **Cmd+Enter** | Save in the edit window |
| **Escape** | In the edit window: save and close (**Cancel** discards). Elsewhere: close the open window |

Board shortcuts do nothing while a window is open or while you are typing in a field.

---

## Using It From Claude and Codex

The repo includes an MCP server (`src/mcp-server.mjs`) that lets Claude Code, Claude Desktop and Codex read and update your board. Changes an agent makes appear in the open app within a couple of seconds. Setup is in the "Use it from Claude and Codex" section of `README.md`.

---

## Data Location

| What | Where |
|------|-------|
| Task data | `~/Library/Application Support/kanban-app/kanban-data.json` |
| Attachments | `~/Library/Application Support/kanban-app/images/` |
| Daily summaries | `~/Library/Application Support/kanban-app/summaries/` |

### Backup

Copy the entire `~/Library/Application Support/kanban-app/` folder to back up everything — tasks, attachments, and summaries.

### Building the App

```bash
cd /Applications/kanban-app
npm run build
```

Creates a macOS DMG in the `release/` folder using electron-builder.
