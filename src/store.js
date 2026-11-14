// The one place that reads and writes kanban-data.json.
// CommonJS: bundled into the Electron main process and imported by the MCP server.
const fs = require('fs');

// File text, or null when there is no file yet.
function read(file) {
    try {
        return fs.readFileSync(file, 'utf8');
    } catch (e) {
        if (e.code === 'ENOENT') return null;
        throw e;
    }
}

// Strict: a missing file is an empty board, anything unparseable throws.
// Returning an empty board for a corrupt file would let the next save wipe it.
function parse(text) {
    if (text === null) return { tasks: [], tags: [] };
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object') throw new Error('not a kanban board');
    const board = Array.isArray(data) // legacy: bare task array
        ? { tasks: data, tags: [] }
        : { tasks: data.tasks || [], tags: data.tags || [] };
    // Legacy: `content` became `title` + `description`. In memory only; whoever saves next persists it.
    for (const task of board.tasks) {
        if (task.content !== undefined && task.title === undefined) {
            task.title = task.content;
            task.description = '';
            delete task.content;
        }
    }
    return board;
}

function load(file) {
    return parse(read(file));
}

// Atomic: readers see the old file or the new one, never half of one.
// Returns the text written.
function save(file, data) {
    const text = JSON.stringify(data, null, 2);
    const tmp = `${file}.${process.pid}.tmp`;
    try {
        fs.writeFileSync(tmp, text);
        fs.renameSync(tmp, file);
    } catch (e) {
        fs.rmSync(tmp, { force: true });
        throw e;
    }
    return text;
}

// Has the file changed since the text we last loaded or saved?
function isStale(onDisk, lastSeen) {
    return onDisk !== lastSeen;
}

// Save unless something else changed the file since `lastSeen`. Returns the text written, or null if refused.
function saveIfFresh(file, data, lastSeen) {
    if (isStale(read(file), lastSeen)) return null;
    return save(file, data);
}

module.exports = { read, parse, load, save, isStale, saveIfFresh };
