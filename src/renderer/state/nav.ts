import { AppState } from './types'
import { getTasksByStatus, getTasksByTag, getUntaggedTasks } from './selectors'

export type NavKey = 'up' | 'down' | 'left' | 'right'
export interface Focus { id: string; col: number }

// The board as it is drawn: one array of task ids per column, left to right, top to bottom.
// Uses the same selectors as StatusView/TagView, so filters and sort order match the screen.
export function getVisibleColumns(state: AppState): string[][] {
  const columns = state.currentView === 'status'
    ? (['todo', 'doing', 'done'] as const).map(status => getTasksByStatus(state, status))
    : [...state.tags.map(tag => getTasksByTag(state, tag.id)), getUntaggedTasks(state)]
  return columns.map(tasks => tasks.map(t => t.id))
}

// Is this keydown a board shortcut at all? Returns its key, or null when it belongs to someone else.
// `busy`: a dialog is open or a field has focus. `onControl`: focus is on a button or link.
export function boardKey(
  e: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'repeat' | 'defaultPrevented'>,
  { busy, onControl }: { busy: boolean; onControl: boolean },
): string | null {
  // Plain keys only (Cmd+X, Cmd+K, Ctrl+D are not ours), and not one another handler already
  // consumed (e.g. a keyboard drag).
  if (busy || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return null
  if (e.key === 'Enter' && onControl) return null // Enter presses the focused button (e.g. Undo)
  if (e.key === 'x' && e.repeat) return null // a held key must not mow down the column: undo is one level
  return e.key
}

// Which column the focused card is in. In tag view one task can sit in several columns, so the
// id alone is ambiguous: `hint` is the column the user last navigated to. -1 = not on screen.
export function columnOf(columns: string[][], id: string | null, hint = -1): number {
  if (id === null) return -1
  return columns[hint]?.includes(id) ? hint : columns.findIndex(c => c.includes(id))
}

// Where focus goes next. Returns null only for an empty board.
export function nextFocus(columns: string[][], focusedId: string | null, key: NavKey, hint = -1): Focus | null {
  const col = columnOf(columns, focusedId, hint)
  if (focusedId === null || col === -1) {
    const first = columns.findIndex(c => c.length > 0)
    return first === -1 ? null : { id: columns[first][0], col: first }
  }

  const row = columns[col].indexOf(focusedId)
  if (key === 'up' || key === 'down') {
    const next = columns[col][row + (key === 'down' ? 1 : -1)]
    return { id: next ?? focusedId, col }
  }

  const step = key === 'right' ? 1 : -1
  for (let c = col + step; c >= 0 && c < columns.length; c += step) {
    if (columns[c].length > 0) return { id: columns[c][Math.min(row, columns[c].length - 1)], col: c }
  }
  return { id: focusedId, col }
}
