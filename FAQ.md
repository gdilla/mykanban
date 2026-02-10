# FAQ

### Where is my data stored?

Everything is local on your machine:

- **Task data:** `~/Library/Application Support/Kanban/kanban-data.json`
- **Attachments:** `~/Library/Application Support/Kanban/images/`
- **Daily summaries:** `~/Library/Application Support/Kanban/summaries/`

You can see these paths at the bottom of the filter bar (click "Filters" in the header).

---

### How do I back up my data?

Copy the entire `~/Library/Application Support/Kanban/` folder. This includes your task data, all attachments, and daily summaries. To restore, put the folder back in the same location.

---

### Can I use this on multiple computers?

Not with built-in sync. The data is stored locally. You could manually copy the `Kanban` folder between machines, or put it in a synced folder (like Dropbox or iCloud), but there's no conflict resolution — don't edit on two machines simultaneously.

---

### How do I change a task's status?

Drag the task card to a different column in Status view. Dragging to "In Progress" starts a timer. Dragging to "Done" stops it and records the completion time.

---

### What's the difference between Status view and Tags view?

**Status view** groups tasks into three columns: To Do, In Progress, Done. Each task appears in exactly one column.

**Tags view** groups tasks by tag. Each tag gets its own column, plus an "Untagged" column. Tasks with multiple tags appear in multiple columns simultaneously. Each card shows a status badge (To Do / In Progress / Done) since the column doesn't imply status.

Switch between views using the "Status" and "Tags" buttons in the header.

---

### Can a task have multiple tags?

Yes. A task can have zero or more tags. In Tags view, multi-tagged tasks appear in every relevant tag column. You can assign tags via the "+" button on the card, in the edit modal, or in the Quick Add form.

---

### How does time tracking work?

It's automatic:

1. Move a task to **In Progress** — a timer starts
2. Move it to **Done** (or back to **To Do**) — the timer stops and elapsed time is added to the total
3. Move it back to **In Progress** — the timer resumes from where it left off

The active timer shows as a pulsing green badge on the card. Accumulated time shows as a static green badge. Time persists across app restarts.

---

### How do I add images or files to a task?

Open a task for editing (click the card content), then either:

- **Paste an image** — Copy a screenshot or image, then press Cmd+V in the edit modal
- **Attach any file** — Click the "attach files" link below the description field to open a file picker

Images are auto-resized to max 1920px. Other file types are stored as-is. Thumbnails appear on the card after saving.

---

### What file types can I attach?

Any file type. Images (PNG, JPEG, GIF, WebP) get visual thumbnails and lightbox previews. Non-image files (PDF, DOC, ZIP, etc.) show a file extension badge on the card and in the edit modal.

---

### How do I reorder tasks?

Drag a task card up or down within its column. An orange line shows where the card will land. The order is saved automatically.

---

### Are the sort orders in Status and Tags views independent?

Yes, completely independent. Reordering tasks in Status view does not affect their position in Tags view, and vice versa. In Tags view, each tag column has its own independent ordering — a task can be position #1 in the "Work" column and position #5 in the "Urgent" column.

---

### What do the colored badges on cards mean?

| Badge | Meaning |
|-------|---------|
| Red border + red shadow | Task is overdue |
| Orange border + orange shadow | Task is due within 2 days |
| Gray "Xd old" badge | Days since task was created (To Do tasks only) |
| Orange "Xd old" badge | Task has been in To Do for 30+ days (stale) |
| Green time badge (static) | Total time tracked on this task |
| Green time badge (pulsing) | Task is in progress — timer is running |
| Colored status pill (tag view) | Task's current status (To Do / In Progress / Done) |

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

Summaries are saved to `~/Library/Application Support/Kanban/summaries/`. View them from the "Summaries" button in the header, or generate one on demand with the "Summary" button.

---

### How do I filter tasks?

Click "Filters" in the header to open the filter bar:

- **By tag:** Click one or more tags to show only tasks matching ALL selected tags
- **By age:** Set a minimum age in days and click "Apply" to hide newer To Do tasks
- **Sort by age:** Click "Sort by Age" to order the To Do column oldest-first

Click "Clear Filters" to reset everything.

---

### Can I delete a tag?

Yes. Open the Tag Manager (click "Tags" in the header), then click the "x" button next to the tag you want to remove. The tag will be removed from all tasks that had it.

---

### How do I edit a due date without opening the task?

Click the due date badge on the card (e.g., "Due: Feb 15" or "+ Due date"). A calendar picker appears inline. Pick a date and it saves immediately — no need to open the edit modal.

---

### What happens to my data if I close the app?

Closing the window hides the app to the system tray — it keeps running in the background for reminders and the Cmd+T hotkey. Your data is saved to disk after every change, so nothing is lost. To fully quit, use Cmd+Q.

---

### How do I build/package the app?

```bash
cd /Applications/kanban-app
npm run build
```

This uses electron-builder to create a macOS DMG in the `dist/` folder.

---

### What are the keyboard shortcuts?

| Shortcut | Action |
|----------|--------|
| Cmd+T | Open Quick Add modal (works globally, even when app is in background) |
| Enter | Submit the current form (add task, quick add, new tag) |
| Escape | Close any open modal, lightbox, or overlay |
