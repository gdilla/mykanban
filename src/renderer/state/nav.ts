import { AppState } from './types'
import { getBoardColumns } from './selectors'

export type NavKey = 'up' | 'down' | 'left' | 'right'

export const NAV_KEYS: Record<string, NavKey> = {
  ArrowDown: 'down', j: 'down',
  ArrowUp: 'up', k: 'up',
  ArrowLeft: 'left', h: 'left',
  ArrowRight: 'right', l: 'right',
}
export interface Focus { id: string; col: number }

// The board as it is drawn: one array of task ids per column, left to right, top to bottom.
// Same selector as the views, so filters, sort order and the collapsed Done column match the screen.
export function getVisibleColumns(state: AppState): string[][] {
  return getBoardColumns(state).map(tasks => tasks.map(t => t.id))
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
  // A held key repeats navigation only. Held x would mow down the column (undo is one level); held d
  // would flip a card between Done and To do, wiping its timestamps.
  if (e.repeat && !NAV_KEYS[e.key]) return null
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

// The one column whose copy of the focused card is highlighted and holds native focus. -1 = none on screen.
export function focusedColumn(state: AppState, columns = getVisibleColumns(state)): number {
  return columnOf(columns, state.focusedTaskId, state.focusedCol)
}

// A card took native focus (Tab, a click, a closing dialog handing focus back): the highlight follows it,
// so the keys that act on the highlighted card (Enter, x, d, 1-3) and Space, which picks up the natively
// focused one, always mean the same card. `col` is the column that copy of the card is drawn in.
// Null when that copy is already the highlighted one: nothing to dispatch, which is also what keeps this
// from looping with the keyboard handler giving the highlighted card native focus.
export function focusTaken(state: AppState, id: string, col: number): Focus | null {
  return state.focusedTaskId === id && focusedColumn(state) === col ? null : { id, col }
}
