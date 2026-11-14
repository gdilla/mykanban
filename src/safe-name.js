const path = require('path');

// Join a renderer-supplied filename onto a storage directory, refusing anything
// that is not a bare filename (so '../../x' or '/etc/passwd' never leaves `dir`).
function safeJoin(dir, name) {
    if (typeof name !== 'string' || !name || name === '.' || name === '..' || path.basename(name) !== name) {
        throw new Error(`Invalid filename: ${name}`);
    }
    return path.join(dir, name);
}

module.exports = { safeJoin };
