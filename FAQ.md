# FAQ

### Where is my data stored?

Everything is local on your machine:

- **Task data:** `~/Library/Application Support/kanban-app/kanban-data.json`
- **Attachments:** `~/Library/Application Support/kanban-app/images/`
- **Daily summaries:** `~/Library/Application Support/kanban-app/summaries/`

The installed app and a run from source (`npm start` / `npm run dev`) use the same folder.

---

### How do I back up my data?

Copy the entire `~/Library/Application Support/kanban-app/` folder. This includes your task data, all attachments, and daily summaries. To restore, put the folder back in the same location.

---

### Can I use this on multiple computers?

Not with built-in sync. The data is stored locally. You could manually copy the `kanban-app` folder between machines, or put it in a synced folder (like Dropbox or iCloud), but there's no conflict resolution — don't edit on two machines simultaneously.

---

### How do I change a task's status?

Drag the task card to a different column in Status view. Dragging to "In Progress" records the start time. Dragging to "Done" records the completion time and adds the elapsed time to the task's total.

From the keyboard, focus a card and press `1`, `2` or `3` to move it to To Do, In Progress or Done, or `d` to mark it done. Hovering a card also shows quick action buttons.

---

### What's the difference between Status view and Tags view?

**Status view** groups tasks into three columns: To Do, In Progress, Done. Each task appears in exactly one column.

**Tags view** groups tasks by tag. Each tag gets its own column, plus an "Untagged" column. Tasks with multiple tags appear in multiple columns simultaneously. Each card has a small status dot colored by status, since the column doesn't imply status. Dragging a card onto a tag column gives it that tag; its status does not change.

Switch between views using the "Status" and "Tags" buttons in the header.

---

### Can a task have multiple tags?

Yes. A task can have zero or more tags. In Tags view, multi-tagged tasks appear in every relevant tag column. You can assign tags in the edit window, in the Quick Add form, or by dragging the card onto a tag column in Tags view.

---

### How does time tracking work?

It's automatic:

1. Move a task to **In Progress** — the start time is recorded
2. Move it to **Done** — the time elapsed since then is added to the task's total
3. Move it back to **In Progress** and to **Done** again — the new stretch is added to the total

Moving a task back to **To Do** clears the start time without adding to the total.

The total shows as a clock badge on the card (e.g., "2h 15m"). It is elapsed clock time, not active work time, and it persists across app restarts.

---

### How do I add images or files to a task?

Open a task for editing (click the card, or focus it and press Enter), then either:

- **Paste an image** — Copy a screenshot or image, then press Cmd+V in the edit window
- **Attach any file** — Click "Attach files" in the Attachments section to open a file picker

Files are stored as-is. After saving, the card shows a paperclip badge with the number of attachments.

---

### What file types can I attach?

Any file type. In the edit window, images (PNG, JPEG, GIF, WebP) show a thumbnail and other files (PDF, DOC, ZIP, etc.) show their file name. Click any attachment to open it in its default app.

---

### How do I reorder tasks?

Drag a task card up or down within its column. The other cards move aside to show where it will land. The order is saved automatically.

---

### Are the sort orders in Status and Tags views independent?

Yes, completely independent. Reordering tasks in Status view does not affect their position in Tags view, and vice versa. In Tags view, each tag column has its own independent ordering — a task can be position #1 in the "Work" column and position #5 in the "Urgent" column.

---

### What do the colored badges on cards mean?

| Badge | Meaning |
|-------|---------|
| Red "Xd overdue" badge | Task is overdue |
| Highlighted due date ("today", "tomorrow") | Task is due soon |
| Plain due date (e.g., "feb 15") | Task is due later |
| Clock badge (e.g., "2h 15m") | Total time tracked on this task |
| Paperclip badge with a number | Number of attachments |
| Colored status dot | Task's current status (To Do / In Progress / Done) |

---

### How do reminders work?

The app sends macOS notifications every 30 minutes during work hours (8am–5pm). Each notification shows:

- Number of To Do and In Progress tasks
- Number of overdue tasks (if any)

Click the notification to bring the app to the foreground. Reminders only fire while the app is running (it stays alive in the background when you close the window).

---

### What are daily summaries?

At 9pm each day, the app auto-generates a markdown summary file with:

- Task counts (To Do, In Progress, Done)
- Tasks completed today with time spent
- Time breakdown with percentages
- Currently in-progress tasks
- Overdue warnings
- Tomorrow's priorities
- Per-tag breakdowns

Summaries are saved to `~/Library/Application Support/kanban-app/summaries/`. View them from the "Summaries" button in the header, or generate one on demand from the same window. If the Mac was asleep at 9pm, the summary is written when the app next checks that evening.

---

### How do I filter tasks?

Click "Filters" in the header to open the filter bar:

- **By tag:** Click one or more tags to show only tasks that have at least one of the selected tags
- **By age:** Click 1d, 3d, 1w, 2w or 1m to show only tasks created within that period

Click "Clear" to reset everything.

---

### Can I delete a tag?

Yes. Open the tag manager from the header, then click the delete button next to the tag you want to remove and confirm. The tag will be removed from all tasks that had it. You can also rename or recolor a tag there.

---

### What happens to my data if I close the app?

Closing the window hides it — the app keeps running in the background for reminders and the Control+Option+K hotkey. There is no tray or menu bar icon; click the Dock icon to bring the window back. Your data is saved to disk after every change, so nothing is lost. To fully quit, use Cmd+Q.

---

### How do I build/package the app?

```bash
cd /Applications/kanban-app
npm run build
```

This uses electron-builder to create a macOS DMG in the `release/` folder.

---

### Can Claude or Codex use my board?

Yes. The repo includes an MCP server that lets Claude Code, Claude Desktop and Codex list, add, update, move and delete tasks in the same data file. Changes an agent makes show up in the open app within a couple of seconds. See "Use it from Claude and Codex" in `README.md` for setup.

---

### What are the keyboard shortcuts?

| Shortcut | Action |
|----------|--------|
| Control+Option+K | Open Quick Add (works globally, even when app is in background) |
| Cmd+N | Open Quick Add (in the app) |
| Cmd+K | Command palette: search tasks, run actions, filter by tag |
| Arrow keys or `h` `j` `k` `l` | Move focus between cards and columns |
| Enter | Edit the focused task; in a form, submit it (add task, quick add, new tag) |
| `d` | Mark the focused task done |
| `x` | Delete the focused task (an Undo toast restores it) |
| `1` / `2` / `3` | Move the focused task to To Do / In Progress / Done |
| Cmd+Enter | Save in the edit window |
| Escape | In the edit window: save and close (Cancel discards). Elsewhere: close the open window |

Board shortcuts do nothing while a window is open or while you are typing in a field.
