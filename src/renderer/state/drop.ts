import { arrayMove } from '@dnd-kit/sortable'
import { AppAction, Task } from './types'

export const UNTAGGED = '__untagged__'

export const isStatus = (s: unknown): s is Task['status'] => s === 'todo' || s === 'doing' || s === 'done'

export interface Drop {
  view: 'status' | 'tags'
  taskId: string
  /** The column the card was picked up in. In tag view a task can sit in several columns at once. */
  fromColumnId: string
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
  const order = view === 'status' ? (t: Task) => t.sortOrder || 0
    : columnId === UNTAGGED ? (t: Task) => t.tagSortOrders?.[UNTAGGED] ?? t.sortOrder ?? 0
    : (t: Task) => t.tagSortOrders?.[columnId] || 0
  return tasks.filter(inColumn).sort((a, b) => order(a) - order(b)).map(t => t.id)
}

/** What to dispatch when a card is dropped. Tag view never touches `status`; status view never touches `tags`. */
export function resolveDrop(tasks: Task[], { view, taskId, fromColumnId, columnId, overTaskId, after }: Drop): AppAction[] {
  const task = tasks.find(t => t.id === taskId)
  if (!task || overTaskId === taskId) return []
  if (view === 'status' && !isStatus(columnId)) return []

  const ids = columnIds(tasks, view, columnId)
  const from = ids.indexOf(taskId)
  if (overTaskId !== null && !ids.includes(overTaskId)) return []

  let next: string[]
  if (from !== -1 && fromColumnId === columnId) {
    // Moved within its column: same result as the sortable preview.
    next = arrayMove(ids, from, overTaskId === null ? ids.length - 1 : ids.indexOf(overTaskId))
  } else {
    // Came from another column (in tag view it may already be in this one too): insert beside the card dropped on.
    next = ids.filter(id => id !== taskId)
    next.splice(overTaskId === null ? next.length : next.indexOf(overTaskId) + (after ? 1 : 0), 0, taskId)
  }

  const actions: AppAction[] = []
  if (from === -1) {
    actions.push(view === 'status'
      ? { type: 'MOVE_TASK', id: taskId, status: columnId as Task['status'] }
      : { type: 'UPDATE_TASK', id: taskId, updates: { tags: columnId === UNTAGGED ? [] : [...task.tags, columnId] } })
  }
  if (next.some((id, i) => id !== ids[i])) {
    actions.push({ type: 'REORDER_TASKS', columnId, orderedIds: next, view })
  }
  return actions
}

type Point = { left: number; top: number }

/**
 * Where an arrow key puts a card that is being moved with the keyboard: the top-left corner to snap it to.
 * `columns` are left to right, their cards top to bottom. `at.slot` n means "snapped onto card n" and -1 "at the
 * column top, above the first card"; `at.top` is the dragged card's current top edge.
 * Up/Down step through the column in card order (so card heights do not matter); Left/Right go to the neighbouring
 * column, onto its nearest card or its top when it is empty. Undefined when there is nowhere to go.
 */
export function keyboardMove(
  code: string,
  columns: (Point & { cards: Point[] })[],
  at: { column: number; slot: number; top: number },
): Point | undefined {
  const dx = code === 'ArrowRight' ? 1 : code === 'ArrowLeft' ? -1 : 0
  const dy = code === 'ArrowDown' ? 1 : code === 'ArrowUp' ? -1 : 0
  const column = columns[at.column + dx]
  if (!column || (!dx && !dy)) return undefined
  const { cards } = column
  const gap = (i: number) => Math.abs(cards[i].top - at.top)
  const slot = dx ? cards.reduce((best, _, i) => (gap(i) < gap(best) ? i : best), cards.length ? 0 : -1) : at.slot + dy
  if (slot < -1 || slot >= cards.length) return undefined
  return slot === -1 ? { left: column.left, top: column.top } : { left: cards[slot].left, top: cards[slot].top }
}

/**
 * Whether a card arriving from another column lands below the card it is dropped on.
 * Pointer: once its centre is past that card's centre. Keyboard: when snapped onto the card, so the bottom slot is
 * reachable; moving up past the first card rests on the column top and lands above it.
 */
type Span = { top: number; height: number }
export const landsAfter = (dragged: Span, over: Span, keyboard: boolean) =>
  keyboard ? dragged.top > over.top - 1 : dragged.top + dragged.height / 2 > over.top + over.height / 2
