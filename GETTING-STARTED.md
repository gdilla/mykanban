# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

## Installation

```bash
cd /Applications/kanban-app
npm install
npm start
```

The app opens in its own window. Closing the window hides it to the background — use Cmd+Q to fully quit.

---

## Your First Task

1. Type a task name in the "What needs to be done?" field at the bottom of the **To Do** column
2. The date picker defaults to today — change it or leave it
3. Click **Add** (or press Enter)

Your task appears as a card in the To Do column.

## Editing a Task

Click the card's title or description area to open the edit modal. From here you can change:

- Title and description
- Due date (with a calendar picker, includes a "Clear" button)
- Tags (click to toggle, create new ones via "Tags" in the header)
- Attachments (paste images with Cmd+V, or click "attach files" for any file type)

Click **Save** when done, or **Cancel** to discard changes.

## Moving Tasks

Drag a card to a different column to change its status:

- **To Do** — Task is waiting
- **In Progress** — Starts the time tracker automatically
- **Done** — Stops the timer, records completion time

## Reordering Tasks

Drag a card up or down within its column to set priority. An orange line shows where it will land. The new order saves automatically.

---

## Understanding the Board

### Card Anatomy

Each card shows:

- **Title** — Bold text at the top
- **Description snippet** — First 80 characters in lighter text
- **Tags** — Colored pills below the title, plus a "+" button to add more
- **Badges row** — Due date, age (To Do only), time tracked, active timer (In Progress only)
- **Attachment thumbnails** — First 3 file previews at the bottom (images show visual thumbnails, other files show extension labels)
- **Delete button** — Trash icon, appears on hover (top-right corner)

### Visual States

- **Red left border** — Task is overdue
- **Orange left border** — Task is due within 2 days
- **Orange age badge** — Task has been in To Do for 30+ days
- **Pulsing green badge** — Timer is actively running (task is In Progress)

---

## Views

### Status View (default)

Three columns: To Do | In Progress | Done. Each task appears in exactly one column. Add new tasks from the form at the bottom of the To Do column.

### Tags View

One column per tag, plus an "Untagged" column. Tasks with multiple tags appear in multiple columns. Each column has its own add-task form (creates the task with that tag in To Do status). Cards show a status badge since the column doesn't indicate status.

### Switching Views

Click **Status** or **Tags** in the header. Your choice persists between sessions.

### Independent Ordering

Status view and Tags view have completely separate sort orders. Reordering in one view does not affect the other. In Tags view, each tag column has its own independent order.

---

## Attachments

### Pasting Images

1. Open a task for editing (click the card content)
2. Copy an image or screenshot to your clipboard
3. Press **Cmd+V** in the edit modal
4. A thumbnail appears in the Attachments section
5. Click **Save**

Images are auto-resized to max 1920px and saved as PNG or JPEG.

### Attaching Files

1. Open a task for editing
2. Click **attach files** (below the description field)
3. Select one or more files from the picker
4. Files appear in the Attachments section
5. Click **Save**

Any file type is supported. Images get visual thumbnails; other files show an extension label.

### Viewing on Cards

After saving, the card shows the first 3 attachment thumbnails. Click an image thumbnail to open a fullscreen lightbox preview (click anywhere or press Escape to close). If there are more than 3 attachments, a "+N more" badge appears.

---

## Tags

### Creating Tags

1. Click **Tags** in the header to open the Tag Manager
2. Type a name in the "New tag name" field
3. Pick a color (or use the default)
4. Click **Add** (or press Enter)

### Assigning Tags to Tasks

- **From the card:** Click the green "+" button on any card
- **From the edit modal:** Click tags to toggle them on/off
- **From Quick Add:** Select tags before adding the task
- **From Tag view:** Add a task from a tag column's form — it's automatically tagged

### Filtering by Tag

Click **Filters** in the header, then click one or more tags. Only tasks matching ALL selected tags are shown. Click **Clear Filters** to reset.

---

## Time Tracking

Time tracking is automatic:

| Action | Effect |
|--------|--------|
| Move task to In Progress | Timer starts |
| Move task out of In Progress | Timer stops, time accumulated |
| Move task back to In Progress | Timer resumes |

- **Active timer** — Pulsing green badge on In Progress cards, updates every 60 seconds
- **Total time** — Static green badge showing accumulated duration (e.g., "2h 15m")
- Time persists across app restarts

---

## Reminders & Summaries

### Reminders

The app sends macOS notifications every 30 minutes during work hours (8am–5pm) with task counts and overdue warnings. Click a notification to bring the app into focus.

Reminders only work while the app is running. The app stays alive in the background when you close the window.

### Daily Summaries

At 9pm, the app auto-generates a markdown summary with completed tasks, time breakdowns, overdue warnings, and tomorrow's priorities.

**View summaries:** Click **Summaries** in the header to browse all past summaries.

**Generate on demand:** Click **Summary** in the header to create one right now.

**File location:** `~/Library/Application Support/Kanban/summaries/`

---

## Quick Add (Cmd+T)

Press **Cmd+T** from anywhere — even when the app is in the background — to open the Quick Add modal.

Set the title, description, due date, status, and tags all in one form. Press **Enter** or click **Add** to create the task.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Cmd+T** | Open Quick Add (global — works even when app is in background) |
| **Enter** | Submit the current form |
| **Escape** | Close any modal, overlay, or lightbox |

---

## Data Location

| What | Where |
|------|-------|
| Task data | `~/Library/Application Support/Kanban/kanban-data.json` |
| Attachments | `~/Library/Application Support/Kanban/images/` |
| Daily summaries | `~/Library/Application Support/Kanban/summaries/` |

### Backup

Copy the entire `~/Library/Application Support/Kanban/` folder to back up everything — tasks, attachments, and summaries.

### Building the App

```bash
cd /Applications/kanban-app
npm run build
```

Creates a macOS DMG in the `dist/` folder using electron-builder.
