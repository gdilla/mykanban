// Local-date helpers for the main process. Pure (no Electron, no fs) so vitest can load them.
// Date-only values are local YYYY-MM-DD strings: never derive one from toISOString() (that is UTC).

const SUMMARY_HOUR = 21;

const pad = n => String(n).padStart(2, '0');

// Local calendar date of a Date, as YYYY-MM-DD
function localDateStr(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Was this task completed on the local date `dateStr`? (completedAt is a UTC timestamp)
function completedOn(task, dateStr) {
    return task.status === 'done' && !!task.completedAt
        && localDateStr(new Date(task.completedAt)) === dateStr;
}

// Is this open task overdue on the local date `dateStr`? Due today is not overdue.
function isOverdue(task, dateStr) {
    return !!task.dueDate && task.status !== 'done' && task.dueDate < dateStr;
}

function summaryFileName(date) {
    return `summary-${localDateStr(date)}.md`;
}

// The moment the daily summary is due on `date`'s local day
function summaryTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), SUMMARY_HOUR);
}

module.exports = { localDateStr, completedOn, isOverdue, summaryFileName, summaryTime };
