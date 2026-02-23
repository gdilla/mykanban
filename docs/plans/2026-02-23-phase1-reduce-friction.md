# Phase 1: Reduce Friction — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make common actions faster — inline editing, keyboard navigation, quick status changes, and a command palette.

**Architecture:** All changes are in `src/index.html` (CSS + HTML + JS). No new files. Each task adds CSS, HTML (if needed), and JS in that order. Features are independent — each can be committed and tested standalone.

**Tech Stack:** Vanilla JS, HTML5 contenteditable, native context menus (custom div-based), flatpickr (existing).

---

## Task 1: Inline Title Editing

Double-click a card title to edit it in-place. Enter saves, Escape cancels. No modal round-trip for quick renames.

**Files:**
- Modify: `src/index.html:349-356` (CSS — add `.task-title[contenteditable]` styles)
- Modify: `src/index.html:1683-1687` (JS — add double-click handler alongside existing click handler)
- Modify: `src/index.html:1599-1701` (JS — `createTaskElement` to support inline editing)

**Step 1: Add CSS for contenteditable title state**

Add after the `.task-title` rule (line ~356) in the `<style>` section:

```css
.task-title[contenteditable="true"] {
    outline: 2px solid var(--shadow-color);
    outline-offset: 2px;
    background: white;
    padding: 2px 4px;
    cursor: text;
    min-height: 1.5em;
}
.task-title[contenteditable="true"]:focus {
    outline-color: var(--accent-progress);
}
```

**Step 2: Add inline editing JS**

Add a new function `startInlineEdit(taskId, titleEl)` after the `createTaskElement` function (after line ~1701):

```javascript
function startInlineEdit(taskId, titleEl) {
    if (titleEl.contentEditable === 'true') return; // Already editing
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const originalText = task.title || '';
    titleEl.contentEditable = 'true';
    titleEl.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(titleEl);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    function finishEdit(save) {
        titleEl.contentEditable = 'false';
        if (save) {
            const newTitle = titleEl.textContent.trim();
            if (newTitle && newTitle !== originalText) {
                task.title = newTitle;
                saveData();
            } else {
                titleEl.textContent = originalText;
            }
        } else {
            titleEl.textContent = originalText;
        }
        titleEl.removeEventListener('keydown', handleKey);
        titleEl.removeEventListener('blur', handleBlur);
    }

    function handleKey(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEdit(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            finishEdit(false);
        }
    }

    function handleBlur() {
        finishEdit(true);
    }

    titleEl.addEventListener('keydown', handleKey);
    titleEl.addEventListener('blur', handleBlur);
}
```

**Step 3: Wire up double-click on card title in `createTaskElement`**

Replace the existing click handler block (lines ~1683-1687):

```javascript
// Single click on content opens edit modal
div.querySelector('.task-content').onclick = (e) => {
    e.stopPropagation();
    editTask(task.id);
};

// Double click on title starts inline editing
const titleEl = div.querySelector('.task-title');
titleEl.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    startInlineEdit(task.id, titleEl);
});
```

**Step 4: Test manually**

Run: `cd /Applications/kanban-app && npm start`
- Double-click a card title → should become editable with outline
- Type new text, press Enter → title saves without opening modal
- Double-click, press Escape → reverts to original
- Double-click, click elsewhere (blur) → saves
- Single click card content → still opens edit modal

**Step 5: Commit**

```bash
git add src/index.html
git commit -m "feat: add inline title editing on double-click"
```

---

## Task 2: Keyboard Navigation

Arrow keys move focus between cards and columns. Hotkeys on focused card: Enter (edit), d (toggle done), x (delete), e (date picker).

**Files:**
- Modify: `src/index.html` CSS section (add `.task.focused` styles)
- Modify: `src/index.html:2997-3006` (JS — extend keydown handler)

**Step 1: Add CSS for focused card**

Add after the `.task.dragging` rule (~line 326):

```css
.task.focused {
    outline: 3px solid var(--shadow-color);
    outline-offset: 2px;
    transform: rotate(0deg);
    box-shadow: 6px 6px 0 var(--shadow-color);
    z-index: 10;
}
```

**Step 2: Add focus management state and functions**

Add after the global state variables section (~line 1417), a new `focusedTaskIndex` variable and navigation functions:

```javascript
let focusedTaskIndex = -1;

function getVisibleTaskCards() {
    return Array.from(document.querySelectorAll('.task:not(.hidden)'));
}

function setFocusedTask(index) {
    const cards = getVisibleTaskCards();
    // Remove old focus
    document.querySelectorAll('.task.focused').forEach(el => el.classList.remove('focused'));
    if (index < 0 || index >= cards.length) {
        focusedTaskIndex = -1;
        return;
    }
    focusedTaskIndex = index;
    cards[index].classList.add('focused');
    cards[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function moveFocus(direction) {
    const cards = getVisibleTaskCards();
    if (cards.length === 0) return;

    if (direction === 'down') {
        setFocusedTask(focusedTaskIndex < cards.length - 1 ? focusedTaskIndex + 1 : 0);
    } else if (direction === 'up') {
        setFocusedTask(focusedTaskIndex > 0 ? focusedTaskIndex - 1 : cards.length - 1);
    } else if (direction === 'left' || direction === 'right') {
        if (focusedTaskIndex < 0) { setFocusedTask(0); return; }
        const currentCard = cards[focusedTaskIndex];
        const currentCol = currentCard.closest('.column');
        const columns = Array.from(document.querySelectorAll('.column'));
        const colIndex = columns.indexOf(currentCol);
        const targetColIndex = direction === 'right'
            ? Math.min(colIndex + 1, columns.length - 1)
            : Math.max(colIndex - 1, 0);
        if (targetColIndex === colIndex) return;
        const targetCol = columns[targetColIndex];
        const targetCards = Array.from(targetCol.querySelectorAll('.task:not(.hidden)'));
        if (targetCards.length === 0) return;
        // Jump to first card in target column
        const targetGlobalIndex = cards.indexOf(targetCards[0]);
        if (targetGlobalIndex >= 0) setFocusedTask(targetGlobalIndex);
    }
}

function getFocusedTaskId() {
    const cards = getVisibleTaskCards();
    if (focusedTaskIndex < 0 || focusedTaskIndex >= cards.length) return null;
    return cards[focusedTaskIndex].dataset.id;
}
```

**Step 3: Extend the global keydown handler**

Replace the keydown handler at lines ~2997-3006 with an expanded version:

```javascript
document.addEventListener('keydown', e => {
    // Check if any modal is open
    const editModal = document.getElementById('edit-modal');
    const tagModal = document.getElementById('tag-modal');
    const summaryModal = document.getElementById('summary-modal');
    const quickAddModal = document.getElementById('quick-add-modal');
    const tagSelectorModal = document.getElementById('task-tag-selector-modal');
    const preview = document.getElementById('image-preview-overlay');

    const anyModalOpen = editModal.classList.contains('show')
        || tagModal.classList.contains('show')
        || summaryModal.classList.contains('show')
        || quickAddModal.classList.contains('show')
        || tagSelectorModal.classList.contains('show');

    if (e.key === 'Escape') {
        if (preview.classList.contains('show')) {
            preview.classList.remove('show');
            return;
        }
        if (anyModalOpen) {
            closeEditModal(); closeTagManager(); closeSummaryViewer(); closeQuickAdd(); closeTaskTagSelector();
            return;
        }
        // Escape clears focus when no modal open
        setFocusedTask(-1);
        return;
    }

    // Skip keyboard nav if modal open or focused on an input/textarea/contenteditable
    const active = document.activeElement;
    const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA'
        || active.contentEditable === 'true');
    if (anyModalOpen || isTyping) return;

    // Arrow key navigation
    if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        moveFocus('down');
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        moveFocus('up');
    } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        e.preventDefault();
        moveFocus('left');
    } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        moveFocus('right');
    } else if (e.key === 'Enter') {
        const taskId = getFocusedTaskId();
        if (taskId) { e.preventDefault(); editTask(taskId); }
    } else if (e.key === 'd') {
        const taskId = getFocusedTaskId();
        if (taskId) {
            e.preventDefault();
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                const newStatus = task.status === 'done' ? 'todo' : 'done';
                moveTask(taskId, newStatus);
                renderBoard();
            }
        }
    } else if (e.key === 'x') {
        const taskId = getFocusedTaskId();
        if (taskId) { e.preventDefault(); deleteTask(taskId); }
    } else if (e.key === 'e') {
        const taskId = getFocusedTaskId();
        if (taskId) {
            e.preventDefault();
            const card = document.querySelector(`.task[data-id="${taskId}"]`);
            const dueBadge = card?.querySelector('.task-due');
            if (dueBadge) openInlineDatePicker(taskId, dueBadge);
        }
    }
});
```

**Step 4: Reset focus on re-render**

Add to the top of `renderBoard()` (line ~2457):

```javascript
focusedTaskIndex = -1;
```

**Step 5: Test manually**

Run: `cd /Applications/kanban-app && npm start`
- Press down arrow → first card gets focus ring
- Arrow keys / j/k/h/l → navigate between cards and columns
- Enter on focused card → opens edit modal
- `d` on focused card → toggles to done/todo
- `x` on focused card → delete confirmation
- `e` on focused card → opens date picker
- Escape → clears focus
- Type in add-task input → keyboard nav doesn't interfere

**Step 6: Commit**

```bash
git add src/index.html
git commit -m "feat: add keyboard navigation with arrow keys and card hotkeys"
```

---

## Task 3: Quick Status Change (Context Menu + Hover Buttons)

Right-click a card for status options. Hover shows small status arrow buttons.

**Files:**
- Modify: `src/index.html` CSS section (add context menu + hover button styles)
- Modify: `src/index.html` HTML section (add context menu element)
- Modify: `src/index.html:1599-1701` (JS — `createTaskElement` to add hover buttons)
- Modify: `src/index.html` JS section (add context menu logic)

**Step 1: Add CSS for context menu and hover status buttons**

Add after the `.task-btn:hover` rule (~line 444):

```css
/* Quick status buttons on hover */
.task-status-actions {
    position: absolute;
    top: 8px;
    right: 36px;
    display: flex;
    gap: 3px;
    opacity: 0;
    transition: opacity var(--transition-fast);
    z-index: 2;
}
.task:hover .task-status-actions { opacity: 1; }
.task-status-action {
    width: 22px;
    height: 22px;
    border: 1px solid var(--shadow-color);
    background: var(--surface-card);
    cursor: pointer;
    font-size: 0.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-fast);
    border-radius: 0;
    padding: 0;
}
.task-status-action:hover {
    background: var(--shadow-color);
    color: white;
}
.task-status-action.status-todo { color: var(--accent-todo); }
.task-status-action.status-doing { color: var(--accent-progress); }
.task-status-action.status-done { color: var(--accent-done); }

/* Custom context menu */
.context-menu {
    position: fixed;
    background: var(--surface-card);
    border: 2px solid var(--shadow-color);
    box-shadow: 4px 4px 0 var(--shadow-color);
    z-index: 10000;
    min-width: 160px;
    display: none;
    font-family: var(--font-display);
}
.context-menu.show { display: block; }
.context-menu-item {
    padding: 10px 16px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 1px solid var(--border-subtle);
    transition: background var(--transition-fast);
}
.context-menu-item:last-child { border-bottom: none; }
.context-menu-item:hover {
    background: var(--bg-primary);
}
.context-menu-separator {
    height: 1px;
    background: var(--border-subtle);
}
```

**Step 2: Add context menu HTML**

Add after the image preview overlay (after line ~1380), before `<script>`:

```html
<!-- Context Menu -->
<div class="context-menu" id="context-menu"></div>
```

**Step 3: Add context menu JS**

Add a new function after the inline editing code:

```javascript
function showContextMenu(e, taskId) {
    e.preventDefault();
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const menu = document.getElementById('context-menu');
    const statusOptions = [
        { label: 'Move to To Do', status: 'todo', icon: '📋' },
        { label: 'Move to In Progress', status: 'doing', icon: '🔄' },
        { label: 'Move to Done', status: 'done', icon: '✅' }
    ].filter(opt => opt.status !== task.status);

    menu.innerHTML = statusOptions.map(opt =>
        `<div class="context-menu-item" data-action="move" data-status="${opt.status}" data-task-id="${taskId}">${opt.icon} ${opt.label}</div>`
    ).join('')
    + `<div class="context-menu-separator"></div>`
    + `<div class="context-menu-item" data-action="edit" data-task-id="${taskId}">✏️ Edit</div>`
    + `<div class="context-menu-item" data-action="duplicate" data-task-id="${taskId}">📄 Duplicate</div>`
    + `<div class="context-menu-item" data-action="delete" data-task-id="${taskId}">🗑️ Delete</div>`;

    // Position menu
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.classList.add('show');

    // Adjust if off-screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 8) + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 8) + 'px';

    // Handle clicks
    menu.onclick = (ev) => {
        const item = ev.target.closest('.context-menu-item');
        if (!item) return;
        const action = item.dataset.action;
        const tid = item.dataset.taskId;
        if (action === 'move') {
            moveTask(tid, item.dataset.status);
            renderBoard();
        } else if (action === 'edit') {
            editTask(tid);
        } else if (action === 'duplicate') {
            duplicateTask(tid);
        } else if (action === 'delete') {
            deleteTask(tid);
        }
        hideContextMenu();
    };
}

function hideContextMenu() {
    document.getElementById('context-menu').classList.remove('show');
}

function duplicateTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newTask = {
        ...JSON.parse(JSON.stringify(task)),
        id: generateId(),
        title: task.title + ' (copy)',
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        timeSpent: 0,
        sortOrder: (tasks.filter(t => t.status === task.status).length) * 1000
    };
    // Don't copy attachments (they reference files on disk)
    newTask.attachments = [];
    tasks.push(newTask);
    saveData();
    renderBoard();
}

// Close context menu on any click outside
document.addEventListener('click', hideContextMenu);
document.addEventListener('contextmenu', (e) => {
    if (!e.target.closest('.task')) hideContextMenu();
});
```

**Step 4: Add hover status buttons and context menu to `createTaskElement`**

In the `createTaskElement` function, add status action buttons to the card HTML. Insert after the delete button line (~1670):

```javascript
// Quick status action buttons
const statusActions = [
    { status: 'todo', label: '📋', title: 'Move to To Do' },
    { status: 'doing', label: '🔄', title: 'Move to In Progress' },
    { status: 'done', label: '✅', title: 'Move to Done' }
].filter(s => s.status !== task.status);

const statusActionsHtml = `<div class="task-status-actions">${statusActions.map(s =>
    `<button class="task-status-action status-${s.status}" onclick="event.stopPropagation(); moveTask('${task.id}', '${s.status}'); renderBoard();" title="${s.title}">${s.label}</button>`
).join('')}</div>`;
```

Then include `${statusActionsHtml}` in the innerHTML template right after the delete button.

Also add context menu handler after the drag event listeners (~line 1698):

```javascript
div.addEventListener('contextmenu', (e) => showContextMenu(e, task.id));
```

**Step 5: Test manually**

Run: `cd /Applications/kanban-app && npm start`
- Hover over a card → small status buttons appear top-right (only statuses the card isn't in)
- Click a status button → card moves to that status
- Right-click a card → context menu with Move/Edit/Duplicate/Delete
- Click "Duplicate" → creates copy below
- Click outside menu → menu closes
- Context menu adjusts position near screen edges

**Step 6: Commit**

```bash
git add src/index.html
git commit -m "feat: add quick status buttons, context menu, and task duplication"
```

---

## Task 4: Cmd+K Command Palette

Fuzzy search across tasks, tags, and actions. Type to filter, arrow keys to navigate, Enter to execute.

**Files:**
- Modify: `src/index.html` CSS section (add command palette styles)
- Modify: `src/index.html` HTML section (add palette markup)
- Modify: `src/index.html` JS section (add palette logic + fuzzy matching)

**Step 1: Add CSS for command palette**

Add after the context menu styles:

```css
/* Command Palette */
.command-palette-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 10001;
    display: none;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
}
.command-palette-overlay.show { display: flex; }
.command-palette {
    background: var(--surface-card);
    border: 3px solid var(--shadow-color);
    box-shadow: 8px 8px 0 var(--shadow-color);
    width: 560px;
    max-height: 420px;
    display: flex;
    flex-direction: column;
    font-family: var(--font-body);
}
.command-palette-input {
    padding: 16px 20px;
    border: none;
    border-bottom: 2px solid var(--shadow-color);
    font-family: var(--font-body);
    font-size: 1rem;
    background: var(--surface-card);
    color: var(--text-primary);
    outline: none;
}
.command-palette-input::placeholder {
    color: var(--text-muted);
}
.command-palette-results {
    overflow-y: auto;
    max-height: 340px;
}
.command-palette-item {
    padding: 10px 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--border-subtle);
    transition: background var(--transition-fast);
}
.command-palette-item:last-child { border-bottom: none; }
.command-palette-item:hover,
.command-palette-item.selected {
    background: var(--bg-primary);
}
.command-palette-item-icon {
    font-size: 1rem;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
}
.command-palette-item-text {
    flex: 1;
    min-width: 0;
}
.command-palette-item-title {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.command-palette-item-subtitle {
    font-size: 0.7rem;
    color: var(--text-muted);
    margin-top: 2px;
}
.command-palette-item-badge {
    font-size: 0.65rem;
    padding: 2px 8px;
    border: 1px solid var(--border-subtle);
    color: var(--text-muted);
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    flex-shrink: 0;
}
.command-palette-empty {
    padding: 24px 20px;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
}
.command-palette-hint {
    padding: 8px 20px;
    border-top: 2px solid var(--shadow-color);
    font-size: 0.65rem;
    color: var(--text-muted);
    display: flex;
    gap: 16px;
}
.command-palette-hint kbd {
    background: var(--bg-primary);
    border: 1px solid var(--border-subtle);
    padding: 1px 5px;
    font-family: var(--font-body);
    font-size: 0.6rem;
}
```

**Step 2: Add command palette HTML**

Add after the context menu div:

```html
<!-- Command Palette -->
<div class="command-palette-overlay" id="command-palette-overlay">
    <div class="command-palette">
        <input type="text" class="command-palette-input" id="command-palette-input" placeholder="Search tasks, tags, actions...">
        <div class="command-palette-results" id="command-palette-results"></div>
        <div class="command-palette-hint">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>Enter</kbd> Select</span>
            <span><kbd>Esc</kbd> Close</span>
        </div>
    </div>
</div>
```

**Step 3: Add command palette JS**

Add after the context menu JS:

```javascript
let commandPaletteSelectedIndex = 0;
let commandPaletteItems = [];

function openCommandPalette() {
    const overlay = document.getElementById('command-palette-overlay');
    const input = document.getElementById('command-palette-input');
    overlay.classList.add('show');
    input.value = '';
    commandPaletteSelectedIndex = 0;
    populateCommandPalette('');
    input.focus();
}

function closeCommandPalette() {
    document.getElementById('command-palette-overlay').classList.remove('show');
}

function fuzzyMatch(query, text) {
    if (!query) return true;
    query = query.toLowerCase();
    text = text.toLowerCase();
    if (text.includes(query)) return true;
    let qi = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
        if (text[ti] === query[qi]) qi++;
    }
    return qi === query.length;
}

function fuzzyScore(query, text) {
    if (!query) return 0;
    query = query.toLowerCase();
    text = text.toLowerCase();
    // Exact match at start gets highest score
    if (text.startsWith(query)) return 100;
    if (text.includes(query)) return 80;
    // Fuzzy: count consecutive matches
    let score = 0, consecutive = 0, qi = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
        if (text[ti] === query[qi]) {
            qi++;
            consecutive++;
            score += consecutive * 2;
        } else {
            consecutive = 0;
        }
    }
    return qi === query.length ? score : -1;
}

function getCommandPaletteItems(query) {
    const items = [];
    const statusLabels = { todo: 'To Do', doing: 'In Progress', done: 'Done' };

    // Tasks
    tasks.forEach(task => {
        const text = (task.title || '') + ' ' + (task.description || '');
        if (fuzzyMatch(query, text)) {
            const tagNames = (task.tags || []).map(id => getTagById(id)?.name).filter(Boolean).join(', ');
            items.push({
                type: 'task',
                icon: task.status === 'done' ? '✅' : task.status === 'doing' ? '🔄' : '📋',
                title: task.title || 'Untitled',
                subtitle: tagNames ? `Tags: ${tagNames}` : statusLabels[task.status],
                badge: statusLabels[task.status],
                action: () => editTask(task.id),
                score: fuzzyScore(query, task.title || '')
            });
        }
    });

    // Tags (filter by tag)
    tags.forEach(tag => {
        if (fuzzyMatch(query, 'filter ' + tag.name)) {
            const count = tasks.filter(t => t.tags && t.tags.includes(tag.id)).length;
            items.push({
                type: 'tag',
                icon: '🏷️',
                title: `Filter: ${tag.name}`,
                subtitle: `${count} task${count !== 1 ? 's' : ''}`,
                badge: 'Filter',
                action: () => { toggleFilter(tag.id); renderBoard(); closeCommandPalette(); },
                score: fuzzyScore(query, 'filter ' + tag.name)
            });
        }
    });

    // Actions
    const actions = [
        { title: 'New Task', subtitle: 'Open quick add', icon: '➕', action: () => { closeCommandPalette(); openQuickAdd(); } },
        { title: 'Manage Tags', subtitle: 'Open tag manager', icon: '🏷️', action: () => { closeCommandPalette(); openTagManager(); } },
        { title: 'Generate Summary', subtitle: 'Create daily summary', icon: '📊', action: () => { closeCommandPalette(); manualSummary(); } },
        { title: 'View Summaries', subtitle: 'Browse past summaries', icon: '📝', action: () => { closeCommandPalette(); openSummaryViewer(); } },
        { title: 'Switch to Status View', subtitle: 'View by status columns', icon: '📊', action: () => { closeCommandPalette(); setView('status'); } },
        { title: 'Switch to Tag View', subtitle: 'View by tag columns', icon: '🏷️', action: () => { closeCommandPalette(); setView('tags'); } },
        { title: 'Clear Filters', subtitle: 'Remove all active filters', icon: '🧹', action: () => { closeCommandPalette(); clearFilters(); renderBoard(); } },
    ];

    actions.forEach(a => {
        if (fuzzyMatch(query, a.title + ' ' + a.subtitle)) {
            items.push({
                ...a,
                type: 'action',
                badge: 'Action',
                score: fuzzyScore(query, a.title)
            });
        }
    });

    // Sort by score descending
    items.sort((a, b) => (b.score || 0) - (a.score || 0));
    return items.slice(0, 15);
}

function populateCommandPalette(query) {
    const results = document.getElementById('command-palette-results');
    commandPaletteItems = getCommandPaletteItems(query);

    if (commandPaletteItems.length === 0) {
        results.innerHTML = '<div class="command-palette-empty">No results found</div>';
        return;
    }

    results.innerHTML = commandPaletteItems.map((item, i) => `
        <div class="command-palette-item${i === commandPaletteSelectedIndex ? ' selected' : ''}" data-index="${i}">
            <span class="command-palette-item-icon">${item.icon}</span>
            <div class="command-palette-item-text">
                <div class="command-palette-item-title">${escapeHtml(item.title)}</div>
                ${item.subtitle ? `<div class="command-palette-item-subtitle">${escapeHtml(item.subtitle)}</div>` : ''}
            </div>
            <span class="command-palette-item-badge">${item.badge}</span>
        </div>
    `).join('');

    // Click handler
    results.querySelectorAll('.command-palette-item').forEach(el => {
        el.addEventListener('click', () => {
            const idx = parseInt(el.dataset.index);
            if (commandPaletteItems[idx]) commandPaletteItems[idx].action();
        });
    });
}

function updateCommandPaletteSelection() {
    document.querySelectorAll('.command-palette-item').forEach((el, i) => {
        el.classList.toggle('selected', i === commandPaletteSelectedIndex);
        if (i === commandPaletteSelectedIndex) el.scrollIntoView({ block: 'nearest' });
    });
}

// Wire up input
document.getElementById('command-palette-input').addEventListener('input', (e) => {
    commandPaletteSelectedIndex = 0;
    populateCommandPalette(e.target.value);
});

document.getElementById('command-palette-input').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        commandPaletteSelectedIndex = Math.min(commandPaletteSelectedIndex + 1, commandPaletteItems.length - 1);
        updateCommandPaletteSelection();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        commandPaletteSelectedIndex = Math.max(commandPaletteSelectedIndex - 1, 0);
        updateCommandPaletteSelection();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (commandPaletteItems[commandPaletteSelectedIndex]) {
            commandPaletteItems[commandPaletteSelectedIndex].action();
        }
    } else if (e.key === 'Escape') {
        e.preventDefault();
        closeCommandPalette();
    }
});

// Close on overlay click
document.getElementById('command-palette-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCommandPalette();
});
```

**Step 4: Add Cmd+K shortcut to the global keydown handler**

In the global keydown handler (from Task 2), add before the arrow key checks:

```javascript
// Cmd+K opens command palette
if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openCommandPalette();
    return;
}
```

Also update the Escape handling to close command palette first:

```javascript
if (e.key === 'Escape') {
    const cmdPalette = document.getElementById('command-palette-overlay');
    if (cmdPalette.classList.contains('show')) {
        closeCommandPalette();
        return;
    }
    // ... rest of escape handling
}
```

**Step 5: Add hotkey hint to header**

Update the hotkey hint span (line ~1231) to include Cmd+K:

```html
<span class="hotkey-hint">Press <kbd>⌘T</kbd> quick add · <kbd>⌘K</kbd> command palette</span>
```

**Step 6: Test manually**

Run: `cd /Applications/kanban-app && npm start`
- Cmd+K → palette opens, focused on input
- Type a task name → fuzzy matches appear
- Arrow keys → selection moves
- Enter → executes action (opens task, applies filter, etc.)
- Type "filter" → shows tag filter options
- Type "new" → shows "New Task" action
- Escape → closes palette
- Click outside → closes palette
- Header shows updated hotkey hint

**Step 7: Commit**

```bash
git add src/index.html
git commit -m "feat: add Cmd+K command palette with fuzzy search"
```

---

## Summary

| Task | Feature | Estimated LOC |
|------|---------|---------------|
| 1 | Inline Title Editing | ~60 CSS + JS |
| 2 | Keyboard Navigation | ~100 CSS + JS |
| 3 | Context Menu + Quick Status Buttons + Duplicate | ~150 CSS + HTML + JS |
| 4 | Cmd+K Command Palette | ~250 CSS + HTML + JS |

**Total:** ~560 lines of additions across 4 independent commits.

Each task is self-contained and can be tested independently. Tasks 2 and 4 share a global keydown handler — Task 4 extends what Task 2 creates. Tasks 1 and 3 are fully independent.
