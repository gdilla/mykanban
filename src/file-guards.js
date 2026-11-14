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

// Attachments keep the extension they arrived with and carry no quarantine flag, so handing one to its
// default app can run it (.terminal, .command, .jar, .pkg, .app, a shell script) with no Gatekeeper prompt.
// Only these ordinary document types are opened. Not svg or html (they can script in a browser), not zip.
const OPENABLE = new Set(('png jpg jpeg gif webp heic bmp tiff pdf txt md csv json log rtf '
    + 'doc docx xls xlsx ppt pptx pages numbers key mp3 m4a wav mp4 mov').split(' '));

function isSafeToOpen(filename) {
    return typeof filename === 'string' && OPENABLE.has(path.extname(filename).slice(1).toLowerCase());
}

module.exports = { safeJoin, isAttachmentReferenced, isSafeToOpen };
