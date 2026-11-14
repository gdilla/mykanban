// Task rules shared by the app (renderer reducer) and the MCP server, so a status change
// means the same thing whoever makes it. Plain ESM, no dependencies, no Node or DOM APIs.

// sortOrder that puts a task after everything already in a status column
function endOfColumn(tasks, status) {
  return tasks
    .filter(t => t.status === status)
    .reduce((max, t) => Math.max(max, t.sortOrder || 0), -1) + 1
}

// Returns a copy of `task` moved to `status`. `tasks` is the whole board (the task included);
// `now` is a millisecond timestamp.
export function applyStatusChange(task, status, tasks, now = Date.now()) {
  const nowIso = new Date(now).toISOString()
  const moved = { ...task, status }
  if (status === 'doing' && task.status !== 'doing') moved.startedAt = nowIso
  if (status === 'done' && task.status !== 'done') {
    moved.completedAt = nowIso
    // Time tracking: elapsed clock time since the task was started
    if (task.startedAt) moved.timeSpent = (task.timeSpent || 0) + (now - new Date(task.startedAt).getTime())
  }
  if (status === 'todo') {
    moved.startedAt = null
    moved.completedAt = null
  }
  moved.sortOrder = endOfColumn(tasks, status)
  return moved
}

// A complete task with the app's defaults, placed at the end of its status column.
// `fields`: title, plus optionally description, status, dueDate ('' = none) and tags (ids).
export function newTask(fields, tasks, now = Date.now()) {
  const nowIso = new Date(now).toISOString()
  const status = fields.status || 'todo'
  return {
    id: now.toString(36) + Math.random().toString(36).slice(2, 10),
    title: fields.title,
    description: fields.description || '',
    status,
    dueDate: fields.dueDate || '',
    tags: fields.tags || [],
    attachments: [],
    createdAt: nowIso,
    startedAt: status === 'doing' ? nowIso : null,
    completedAt: status === 'done' ? nowIso : null,
    timeSpent: 0,
    sortOrder: endOfColumn(tasks, status),
    tagSortOrders: {},
  }
}
