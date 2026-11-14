// What the MCP tools do to a board ({ tasks, tags }), with no server and no file I/O so tests can call it.
// Read functions return compact results; write functions change `board` in place and return the result.
// Anything invalid throws an Error whose message tells the agent how to recover.
import path from 'path'
import dates from './dates.js' // CommonJS, shared with the Electron main process
import { applyStatusChange, newTask } from './shared/task-rules.mjs'

const STATUSES = ['todo', 'doing', 'done']

// A status that is not a real one reads as todo, the same repair the app makes on load
const statusOf = task => (STATUSES.includes(task.status) ? task.status : 'todo')

const lower = text => String(text || '').toLowerCase()

// `value` if it is a real calendar date written YYYY-MM-DD
export function checkDate(value, field = 'due') {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = m && new Date(+m[1], m[2] - 1, +m[3])
  if (!date || date.getFullYear() !== +m[1] || date.getMonth() !== m[2] - 1 || date.getDate() !== +m[3]) {
    throw new Error(`${field} must be a real date written YYYY-MM-DD (for example 2026-03-09), got "${value}".`)
  }
  return value
}

// Tag names -> tag ids. Case-insensitive.
export function tagIds(names, tags) {
  const ids = names.map(name => {
    const tag = tags.find(t => lower(t.name) === lower(name).trim())
    if (tag) return tag.id
    throw new Error(tags.length
      ? `Unknown tag "${name}". Valid tags: ${tags.map(t => t.name).join(', ')}.`
      : `Unknown tag "${name}". The board has no tags yet; tags are created in the Kanban app.`)
  })
  return [...new Set(ids)]
}

const tagNames = (task, tags) =>
  (task.tags || []).map(id => tags.find(t => t.id === id)?.name).filter(Boolean)

// The compact row every list shows
const row = (task, tags) => ({
  id: task.id,
  title: task.title,
  status: statusOf(task),
  due: task.dueDate || null,
  tags: tagNames(task, tags),
})

function findTask(board, id) {
  const task = board.tasks.find(t => t.id === id)
  if (!task) throw new Error(`No task with id "${id}". Call list_tasks to find the right id.`)
  return task
}

// Doing first, then todo, each in board order; done last, most recently completed first
const COLUMN_ORDER = { doing: 0, todo: 1, done: 2 }
function byBoardOrder(a, b) {
  const [sa, sb] = [statusOf(a), statusOf(b)]
  if (sa !== sb) return COLUMN_ORDER[sa] - COLUMN_ORDER[sb]
  if (sa === 'done') return (b.completedAt || '').localeCompare(a.completedAt || '')
  return (a.sortOrder || 0) - (b.sortOrder || 0)
}

export function listTasks(board, { status = 'open', tag, query, due_before, limit = 50 } = {}) {
  const tagId = tag === undefined ? null : tagIds([tag], board.tags)[0]
  const dueBefore = due_before === undefined ? null : checkDate(due_before, 'due_before')
  const wanted = status === 'all' ? STATUSES : status === 'open' ? ['todo', 'doing'] : [status]
  const text = lower(query)

  const matches = board.tasks
    .filter(t => wanted.includes(statusOf(t)))
    .filter(t => !tagId || (t.tags || []).includes(tagId))
    .filter(t => !text || lower(t.title).includes(text) || lower(t.description).includes(text))
    .filter(t => !dueBefore || (t.dueDate && t.dueDate <= dueBefore))
    .sort(byBoardOrder)

  const result = { tasks: matches.slice(0, limit).map(t => row(t, board.tags)), total: matches.length }
  if (matches.length > limit) {
    result.note = `Showing ${limit} of ${matches.length}. Narrow with status, tag, query or due_before, or raise limit (max 200).`
  }
  return result
}

// `today` is the local date as YYYY-MM-DD
export function boardSummary(board, today) {
  const counts = { todo: 0, doing: 0, done: 0 }
  for (const t of board.tasks) counts[statusOf(t)]++
  const open = board.tasks.filter(t => statusOf(t) !== 'done').sort(byBoardOrder)
  const dueRow = t => ({ id: t.id, title: t.title, due: t.dueDate })
  return {
    today,
    counts,
    doing: open.filter(t => t.status === 'doing').map(t => ({ id: t.id, title: t.title })),
    overdue: open.filter(t => dates.isOverdue(t, today)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(dueRow),
    due_today: open.filter(t => t.dueDate === today).map(dueRow),
  }
}

const minutes = ms => Math.round((ms || 0) / 60000)

export function taskDetail(board, id, imagesDir) {
  const task = findTask(board, id)
  return {
    ...row(task, board.tags),
    description: task.description || '',
    createdAt: task.createdAt || null,
    startedAt: task.startedAt || null,
    completedAt: task.completedAt || null,
    timeSpentMin: minutes(task.timeSpent),
    attachments: (task.attachments || []).map(a => ({
      name: a.originalName,
      type: a.type,
      path: path.join(imagesDir, path.basename(a.filename)),
    })),
  }
}

function checkTitle(title) {
  if (!String(title).trim()) throw new Error('title must not be empty.')
  return String(title).trim()
}

export function addTask(board, { title, description, due, tags = [], status }, now = Date.now()) {
  const task = newTask({
    title: checkTitle(title),
    description,
    status,
    dueDate: due ? checkDate(due) : '',
    tags: tagIds(tags, board.tags),
  }, board.tasks, now)
  board.tasks.push(task)
  return row(task, board.tags)
}

// `changes`: any of title, description, due ('' or null clears it), tags (names; replaces the set)
export function updateTask(board, id, { title, description, due, tags }) {
  const task = findTask(board, id)
  if ([title, description, due, tags].every(v => v === undefined)) {
    throw new Error('Nothing to change: pass at least one of title, description, due, tags. To change status, call move_task.')
  }
  // Validate everything before changing anything
  const changes = {}
  if (title !== undefined) changes.title = checkTitle(title)
  if (description !== undefined) changes.description = description
  if (due !== undefined) changes.dueDate = due ? checkDate(due) : ''
  if (tags !== undefined) changes.tags = tagIds(tags, board.tags)
  Object.assign(task, changes)
  return row(task, board.tags)
}

export function moveTask(board, id, status, now = Date.now()) {
  let task = findTask(board, id)
  if (task.status !== status) { // already there: nothing to do, so a repeated call is harmless
    task = applyStatusChange(task, status, board.tasks, now)
    board.tasks[board.tasks.findIndex(t => t.id === id)] = task
  }
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    startedAt: task.startedAt || null,
    completedAt: task.completedAt || null,
    timeSpentMin: minutes(task.timeSpent),
  }
}

export function deleteTask(board, id) {
  const task = findTask(board, id)
  board.tasks.splice(board.tasks.indexOf(task), 1)
  return { deleted: { id: task.id, title: task.title } }
}

export function listTags(board) {
  return board.tags.map(tag => ({
    name: tag.name,
    color: tag.color,
    open: board.tasks.filter(t => statusOf(t) !== 'done' && (t.tags || []).includes(tag.id)).length,
  }))
}
