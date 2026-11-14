import { arrayMove } from '@dnd-kit/sortable'
import { AppAction, Task } from './types'

export const UNTAGGED = '__untagged__'

export const isStatus = (s: unknown): s is Task['status'] => s === 'todo' || s === 'doing' || s === 'done'

export interface Drop {
  view: 'status' | 'tags'
  taskId: string
  /** The column dropped into: a status in status view, a tag id or UNTAGGED in tag view. */
  columnId: string
  /** The card dropped on, or null when dropped on the column itself (which means "at the bottom"). */
  overTaskId: string | null
  /** Coming from another column: land after `overTaskId` instead of before it. */
  after?: boolean
}

/** Ids of every task in a column, in the order the selectors show them (filters ignored, so hidden cards keep their place). */
function columnIds(tasks: Task[], view: Drop['view'], columnId: string): string[] {
  const inColumn = view === 'status' ? (t: Task) => t.status === columnId
    : columnId === UNTAGGED ? (t: Task) => t.tags.length === 0
    : (t: Task) => t.tags.includes(columnId)
  const order = view === 'status' ? (t: Task) => t.sortOrder || 0 : (t: Task) => t.tagSortOrders?.[columnId] || 0
  return tasks.filter(inColumn).sort((a, b) => order(a) - order(b)).map(t => t.id)
}

/** What to dispatch when a card is dropped. Tag view never touches `status`; status view never touches `tags`. */
export function resolveDrop(tasks: Task[], { view, taskId, columnId, overTaskId, after }: Drop): AppAction[] {
  const task = tasks.find(t => t.id === taskId)
  if (!task || overTaskId === taskId) return []
  if (view === 'status' && !isStatus(columnId)) return []

  const ids = columnIds(tasks, view, columnId)
  const from = ids.indexOf(taskId)
  const over = overTaskId === null ? -1 : ids.indexOf(overTaskId)
  if (overTaskId !== null && over === -1) return []
  const reorder = (orderedIds: string[]): AppAction => ({ type: 'REORDER_TASKS', columnId, orderedIds, view })

  if (from !== -1) {
    // Already in this column: same result as the sortable preview.
    const to = over === -1 ? ids.length - 1 : over
    return to === from ? [] : [reorder(arrayMove(ids, from, to))]
  }

  ids.splice(over === -1 ? ids.length : over + (after ? 1 : 0), 0, taskId)
  const join: AppAction = view === 'status'
    ? { type: 'MOVE_TASK', id: taskId, status: columnId as Task['status'] }
    : { type: 'UPDATE_TASK', id: taskId, updates: { tags: columnId === UNTAGGED ? [] : [...task.tags, columnId] } }
  return [join, reorder(ids)]
}
