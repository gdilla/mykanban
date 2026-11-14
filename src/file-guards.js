// Guards for the IPC handlers that act on a file the renderer names.
const path = require('path');

// Join a renderer-supplied filename onto a storage directory, refusing anything
// that is not a bare filename (so '../../x' or '/etc/passwd' never leaves `dir`).
function safeJoin(dir, name) {
    if (typeof name !== 'string' || !name || name === '.' || name === '..' || path.basename(name) !== name) {
        throw new Error(`Invalid filename: ${name}`);
    }
    return path.join(dir, name);
}

// True when a task in the saved board (the parsed kanban-data.json) still lists
// this attachment file, so deleting it would leave a broken attachment. Like the
// renderer's loader, a task's legacy `images` list counts only when it has no
// `attachments` (a migrated task keeps its stale `images` key).
function isAttachmentReferenced(board, filename) {
    const tasks = Array.isArray(board) ? board : (board && board.tasks) || [];
    return tasks.some(t => t.attachments
        ? t.attachments.some(a => a.filename === filename)
        : (t.images || []).includes(filename));
}

module.exports = { safeJoin, isAttachmentReferenced };
