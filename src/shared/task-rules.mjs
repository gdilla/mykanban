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

// A copy of `task` whose tagSortOrders match its tags. Call it whenever a task's tags are set.
// `tasks` is the whole board as it was before that change (with the old version of the task, if it had one).
// A tag the task is newly given puts it at the bottom of that tag column. A tag it already had keeps the
// place it has, recorded or not, so editing a task's tags never moves it in its other columns. Places
// under tags it no longer has are dropped (its place in the Untagged column is kept).
export function withTagOrders(task, tasks) {
  const old = task.tagSortOrders || {}
  const had = tasks.find(t => t.id === task.id)?.tags || []
  const tagSortOrders = '__untagged__' in old ? { __untagged__: old.__untagged__ } : {}
  for (const tagId of task.tags || []) {
    if (tagId in old) tagSortOrders[tagId] = old[tagId]
    else if (!had.includes(tagId)) {
      tagSortOrders[tagId] = tasks
        .filter(t => (t.tags || []).includes(tagId))
        .reduce((max, t) => Math.max(max, t.tagSortOrders?.[tagId] || 0), -1) + 1
    }
  }
  return { ...task, tagSortOrders }
}
