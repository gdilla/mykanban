# Kanban App Roadmap

**Approach:** Foundation First — polish existing UX before adding features.
**Vision:** Polished indie app, local-only, single-user.
**Date:** 2026-02-23

---

## Phase 1: Reduce Friction — Fewer Clicks, More Keyboard

### 1a. Inline Title Editing
- Double-click card title to edit in-place (contenteditable)
- Enter saves, Escape cancels
- No modal needed for quick renames

### 1b. Keyboard Navigation
- Arrow keys to move focus between cards (up/down) and columns (left/right)
- Focused card gets a visible ring
- Enter on focused card → open edit modal
- `d` on focused card → toggle done
- `x` on focused card → delete (with confirm)
- `e` on focused card → open inline date picker

### 1c. Quick Status Change
- Right-click context menu on cards: Move to To Do / In Progress / Done
- Drag-free status buttons in card hover state (small arrow icons)

### 1d. Cmd+K Command Palette
- Fuzzy search across tasks, tags, and actions
- Arrow keys to select, Enter to execute
- Actions: "Move [task] to Done", "Filter by [tag]", "Open [task]", etc.

---

## Phase 2: Find Anything — Search & Filtering

### 2a. Global Text Search
- Search bar in header (Cmd+F or `/` to focus)
- Searches task titles and descriptions in real-time
- Matching tasks highlighted, non-matching dimmed (not hidden — keeps spatial context)
- Clear on Escape

### 2b. Advanced Filter Combos
- Filter bar gets "status" filter chips alongside existing tag/age filters
- Multiple filters combine with AND logic
- Filter state shown as removable pills: `tag:Work` `status:doing` `age:>30d`
- Filter presets: "Overdue", "Due This Week", "Stale (30+ days)"

### 2c. Sort Controls
- Per-column sort dropdown: manual (default), by due date, by age, by title
- Sort persists per column until changed

---

## Phase 3: Tame the Board — Visual Density & Organization

### 3a. Collapsible Columns
- Click column header to collapse/expand
- Collapsed columns show just the header + task count
- State persists in localStorage

### 3b. Compact Mode Toggle
- Header toggle: Normal / Compact
- Compact: smaller cards, no description preview, no thumbnails, tighter spacing
- Good for boards with 50+ tasks

### 3c. Done Column Auto-Archive
- Tasks in Done for 7+ days automatically move to an "Archive" section
- Archive is a collapsible section below the board (or a separate view)
- Archived tasks still searchable, can be restored

### 3d. Card Priority Stripe
- Optional priority field on tasks: None, Low, Medium, High, Urgent
- Shows as a colored left border on the card (subtle, not garish)
- Sortable by priority

---

## Phase 4: Deeper Task Model

### 4a. Subtasks / Checklists
- Add checklist items within the edit modal
- Card shows progress: "3/5 done" with mini progress bar
- Check/uncheck inline (no modal needed)
- Subtasks are simple: text + done boolean. No nesting.

### 4b. Task Duplication
- "Duplicate" button in card hover actions and edit modal
- Copies title, description, tags, subtasks, priority, due date
- New task placed below original in same column

### 4c. Task Templates
- Save any task as a template (from edit modal or context menu)
- "New from Template" option in quick-add
- Templates stored alongside data, managed in a simple list modal

---

## Phase 5: Polish & Delight

### 5a. Dark Mode
- Toggle in header (sun/moon icon)
- Full dark theme using CSS variables (swap the palette)
- Respects system preference on first load
- Persists in localStorage

### 5b. Recurring Tasks
- Recurrence rule on tasks: daily, weekly, monthly, custom interval
- When a recurring task is marked Done, a new copy auto-creates in To Do with next due date
- Shows recurrence icon on card

### 5c. Analytics Dashboard
- New view (alongside Status/Tags): "Insights"
- Charts: tasks completed per week, average time-to-done, tasks by tag breakdown
- Simple canvas-based charts (no external charting lib — keep it vanilla)
- Throughput trend line

### 5d. Undo/Redo
- Cmd+Z / Cmd+Shift+Z for recent actions
- Simple action stack (last 20 actions)
- Toast notification: "Task deleted — Undo" with timed auto-dismiss
