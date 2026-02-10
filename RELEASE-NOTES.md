# Release Notes

## v1.0.0 — February 2026

First release of the local-first Kanban board for macOS.

---

### Board & Views

- **Three-column status board** — To Do, In Progress, and Done columns with color-coded headers (red, orange, teal)
- **Tag view** — Switch to a tag-based layout where each tag gets its own column. Tasks with multiple tags appear in multiple columns. An "Untagged" column collects tasks without tags.
- **View toggle** — Switch between Status and Tags views using header buttons. Selection persists across sessions.
- **Task counts** — Each column header shows the number of visible (filtered) tasks

### Task Management

- **Title and description** — Every task has a required title and optional long-form description. Cards show an 80-character description preview.
- **Due dates** — Set via the add form, edit modal, or by clicking the due date badge directly on the card (inline flatpickr picker). Includes a "Clear date" button. Cards without a date show a clickable "+ Due date" affordance.
- **Tags** — Create custom tags with names and colors via the Tag Manager. Assign multiple tags per task. Click the "+" button on any card to quickly add tags without opening the full edit modal.
- **Drag-and-drop reordering** — Drag tasks vertically within a column to set priority. An orange drop indicator shows the insertion point. Sort order is saved automatically.
- **Drag-and-drop status changes** — In Status view, drag a task to a different column to change its status. In Tag view, drag to a different column to assign that tag.
- **Independent sort orders** — Status view and Tag view maintain completely separate orderings. Reordering in one view does not affect the other. Tag view ordering is per-tag-column (a task can have a different position in each tag column it belongs to).
- **Delete with confirmation** — Hover a card to reveal the trash icon. Deleting requires confirmation.

### File Attachments

- **Paste images** — In the edit modal, paste screenshots or images from the clipboard with Cmd+V. Images are auto-resized to a max of 1920px and saved as PNG or JPEG.
- **Attach any file** — Click "attach files" in the edit modal to open a file picker. Supports any file type (PDFs, documents, archives, etc.).
- **Thumbnails on cards** — Cards show the first 3 attachment thumbnails directly. Image attachments show a visual preview; non-image files show a file extension badge (e.g., "PDF", "DOC"). A "+N more" indicator appears when there are more than 3.
- **Lightbox preview** — Click any image thumbnail (on card or in edit modal) to open a fullscreen preview. Click anywhere or press Escape to close.
- **Safe editing** — Removing an attachment in the edit modal doesn't delete the file until you click Save. Canceling restores the original state. Newly pasted files that aren't saved are automatically cleaned up.

### Time Tracking

- **Automatic timers** — Moving a task to "In Progress" starts a timer. Moving it out accumulates the elapsed time. Time persists across sessions.
- **Active timer badge** — Tasks currently in progress show a pulsing green timer badge with the running total (updates every 60 seconds).
- **Time spent badge** — Completed or paused tasks show total accumulated time (e.g., "2h 15m").

### Filtering & Sorting

- **Tag filters** — Click tags in the filter bar to show only tasks matching ALL selected tags (AND logic). Clear Filters button resets.
- **Age filter** — Show only To Do tasks older than N days (configurable, default 30). Toggle on/off with the Apply button.
- **Age sort** — Sort the To Do column by age (oldest first) with a toggle button.
- **Filter bar** — Collapsible panel toggled from the header. Shows active filters and data storage paths.

### Quick Add

- **Global hotkey** — Press Cmd+T from anywhere (even when the app is in the background) to open the Quick Add modal.
- **Full control** — Set title, description, due date, status (To Do / In Progress / Done), and tags all from the quick add form.
- **Enter to submit** — Press Enter to add the task without clicking the button.

### Reminders & Summaries

- **Work-hours reminders** — Desktop notifications every 30 minutes between 8am and 5pm showing task counts and overdue warnings. Click the notification to bring the app to focus.
- **Daily summaries** — Auto-generated at 9pm as markdown files. Includes: tasks completed today, time breakdown with percentages, in-progress tasks, overdue warnings, tomorrow's priorities, and per-tag breakdowns.
- **Summary viewer** — Browse all historical summaries from the "Summaries" button in the header. Two-pane layout: date list on the left, content on the right.
- **Manual trigger** — Click "Summary" in the header to generate a summary on demand.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+T | Open Quick Add modal |
| Enter | Submit forms (add task, quick add, new tag) |
| Escape | Close any open modal or overlay |

### Data & Storage

- **Local-first** — All data stored on your machine. No accounts, no cloud, no sync.
- **Task data** — `~/Library/Application Support/Kanban/kanban-data.json`
- **Attachments** — `~/Library/Application Support/Kanban/images/` (any file type, despite the directory name)
- **Summaries** — `~/Library/Application Support/Kanban/summaries/summary-YYYY-MM-DD.md`
- **Auto-migration** — Legacy data formats are automatically upgraded on launch (no manual steps needed).
- **Minimize to tray** — Closing the window hides the app instead of quitting. The app stays running for reminders and the global hotkey.

### Design

- Brutalist paper aesthetic with warm beige background, grid texture, and paper-like cards with slightly irregular edges
- Typography: Space Grotesk (headings) + JetBrains Mono (body)
- Responsive layout for different window sizes
- Smooth animations: spring transitions for modals, lift effects on hover, drag rotation and scaling
- Visual due date states: red border for overdue, orange for due within 2 days
- Age badges on To Do tasks with "stale" highlight at 30+ days
- Auto-contrast text on colored tag backgrounds

### Technical

- Built with Electron 28 + vanilla JavaScript (no UI frameworks)
- Date picker: flatpickr (via CDN)
- Drag-and-drop: native HTML5 API
- Single-file UI: all CSS, HTML, and JS in `src/index.html`
- Electron main process: `src/main.js` (IPC handlers, scheduling, notifications)
