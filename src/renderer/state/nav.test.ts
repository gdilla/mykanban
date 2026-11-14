import { describe, it, expect } from 'vitest'
import { nextFocus, getVisibleColumns, boardKey, focusedColumn, focusTaken } from './nav'
import { initialState } from './reducer'
import { Task } from './types'

// Three columns in visual order; the middle one is empty.
const cols = [['a', 'b', 'c'], [], ['x', 'y']]

describe('nextFocus', () => {
  it('moves down and up within a column', () => {
    expect(nextFocus(cols, 'a', 'down')).toEqual({ id: 'b', col: 0 })
    expect(nextFocus(cols, 'b', 'up')).toEqual({ id: 'a', col: 0 })
  })

  it('stays put at the top and bottom of a column', () => {
    expect(nextFocus(cols, 'a', 'up')).toEqual({ id: 'a', col: 0 })
    expect(nextFocus(cols, 'c', 'down')).toEqual({ id: 'c', col: 0 })
  })

  it('moves to the adjacent non-empty column, keeping the row where it can', () => {
    expect(nextFocus(cols, 'b', 'right')).toEqual({ id: 'y', col: 2 })
    expect(nextFocus(cols, 'c', 'right')).toEqual({ id: 'y', col: 2 }) // row 2 clamps to the last card
    expect(nextFocus(cols, 'x', 'left')).toEqual({ id: 'a', col: 0 })
  })

  it('stays put at the left and right edges', () => {
    expect(nextFocus(cols, 'a', 'left')).toEqual({ id: 'a', col: 0 })
    expect(nextFocus(cols, 'y', 'right')).toEqual({ id: 'y', col: 2 })
    expect(nextFocus([['a'], [], []], 'a', 'right')).toEqual({ id: 'a', col: 0 })
  })

  it('with nothing focused, any key focuses the top card of the first non-empty column', () => {
    for (const key of ['down', 'up', 'left', 'right'] as const) {
      expect(nextFocus([[], ['p', 'q'], ['r']], null, key)).toEqual({ id: 'p', col: 1 })
    }
  })

  it('treats a focused id that is not on screen as nothing focused', () => {
    expect(nextFocus(cols, 'filtered-out', 'down')).toEqual({ id: 'a', col: 0 })
  })

  it('returns null when the board is empty', () => {
    expect(nextFocus([[], []], null, 'down')).toBeNull()
    expect(nextFocus([], 'a', 'down')).toBeNull()
  })

  it('tag view: a task in two columns is navigated from the column the user is in', () => {
    // "m" carries both tags, so it is on screen twice.
    const tagCols = [['a', 'm', 'b'], ['m', 'c'], ['d']]
    // Without a hint the first occurrence wins.
    expect(nextFocus(tagCols, 'm', 'down')).toEqual({ id: 'b', col: 0 })
    // With the hint, down walks the second column.
    expect(nextFocus(tagCols, 'm', 'down', 1)).toEqual({ id: 'c', col: 1 })
    // Walking right across the board passes through both copies and does not get stuck.
    const first = nextFocus(tagCols, 'a', 'right')!
    expect(first).toEqual({ id: 'm', col: 1 })
    expect(nextFocus(tagCols, first.id, 'right', first.col)).toEqual({ id: 'd', col: 2 })
    // Right from one copy can land on the other copy of the same task; the column still advances.
    const sameRow = [['m', 'a'], ['m', 'c']]
    expect(nextFocus(sameRow, 'm', 'right', 0)).toEqual({ id: 'm', col: 1 })
    expect(nextFocus(sameRow, 'm', 'down', 1)).toEqual({ id: 'c', col: 1 })
    // A stale hint (task is not in that column) falls back to where the task is.
    expect(nextFocus(tagCols, 'a', 'down', 2)).toEqual({ id: 'm', col: 0 })
  })
})

function task(id: string, over: Partial<Task> = {}): Task {
  return {
    id, title: id, description: '', status: 'todo', dueDate: '', tags: [], attachments: [],
    createdAt: new Date().toISOString(), startedAt: null, completedAt: null, timeSpent: 0, sortOrder: 0, tagSortOrders: {},
    ...over,
  }
}

describe('getVisibleColumns', () => {
  const tags = [{ id: 't1', name: 'one', color: '#111' }, { id: 't2', name: 'two', color: '#222' }]
  const tasks = [
    task('done1', { status: 'done', sortOrder: 0 }),
    task('todo2', { sortOrder: 1, tags: ['t1'], tagSortOrders: { t1: 1 } }),
    task('todo1', { sortOrder: 0, tags: ['t1', 't2'], tagSortOrders: { t1: 0, t2: 0 } }),
    task('doing1', { status: 'doing', sortOrder: 0 }),
  ]

  it('status view: To do, In progress, Done, each in sortOrder (not storage order)', () => {
    const state = { ...initialState, tasks, tags, currentView: 'status' as const }
    expect(getVisibleColumns(state)).toEqual([['todo1', 'todo2'], ['doing1'], ['done1']])
  })

  it('tag view: one column per tag in tagSortOrders order, then untagged', () => {
    const state = { ...initialState, tasks, tags, currentView: 'tags' as const }
    expect(getVisibleColumns(state)).toEqual([['todo1', 'todo2'], ['todo1'], ['done1', 'doing1']])
  })

  it('leaves out cards hidden by the active filters', () => {
    const state = { ...initialState, tasks, tags, currentView: 'status' as const, activeFilters: { tags: ['t2'], age: null } }
    expect(getVisibleColumns(state)).toEqual([['todo1'], [], []])
  })
})

describe('focusedColumn', () => {
  // "both" carries two tags, so tag view draws it twice: in column 0 and in column 1
  const tags = [{ id: 't1', name: 'one', color: '#111' }, { id: 't2', name: 'two', color: '#222' }]
  const tasks = [task('both', { tags: ['t1', 't2'] }), task('one', { tags: ['t1'] }), task('none')]
  const tagView = { ...initialState, tasks, tags, currentView: 'tags' as const }

  it('is the column the user navigated to, so only that copy of a multi-tag task is highlighted', () => {
    expect(focusedColumn({ ...tagView, focusedTaskId: 'both', focusedCol: 1 })).toBe(1)
    expect(focusedColumn({ ...tagView, focusedTaskId: 'both', focusedCol: 0 })).toBe(0)
  })

  it('falls back to the first column showing the task when the remembered column is unknown or stale', () => {
    expect(focusedColumn({ ...tagView, focusedTaskId: 'both', focusedCol: -1 })).toBe(0)
    expect(focusedColumn({ ...tagView, focusedTaskId: 'none', focusedCol: 0 })).toBe(2)
  })

  it('is -1 when nothing is focused or the focused task is not on screen', () => {
    expect(focusedColumn(tagView)).toBe(-1)
    expect(focusedColumn({ ...tagView, focusedTaskId: 'gone', focusedCol: 0 })).toBe(-1)
    const hidden = { ...tagView, focusedTaskId: 'none', activeFilters: { tags: ['t1'], age: null } }
    expect(focusedColumn(hidden)).toBe(-1)
  })
})

describe('focusTaken (a card took native focus: Tab, a click, a closing dialog handing focus back)', () => {
  const tags = [{ id: 't1', name: 'one', color: '#111' }, { id: 't2', name: 'two', color: '#222' }]
  const tasks = [task('both', { tags: ['t1', 't2'] }), task('one', { tags: ['t1'] }), task('none')]
  const tagView = { ...initialState, tasks, tags, currentView: 'tags' as const }

  it('the highlight moves to that card, so Enter, x, d and 1-3 act on the card Space would pick up', () => {
    expect(focusTaken(tagView, 'one', 0)).toEqual({ id: 'one', col: 0 }) // nothing was highlighted
    expect(focusTaken({ ...tagView, focusedTaskId: 'both', focusedCol: 0 }, 'one', 0)).toEqual({ id: 'one', col: 0 })
  })

  it('in tag view it is that copy of the card: the column it took focus in', () => {
    expect(focusTaken({ ...tagView, focusedTaskId: 'both', focusedCol: 0 }, 'both', 1)).toEqual({ id: 'both', col: 1 })
  })

  it('is null when that copy is already the highlighted one (no dispatch, so no loop with highlight -> focus)', () => {
    expect(focusTaken({ ...tagView, focusedTaskId: 'both', focusedCol: 1 }, 'both', 1)).toBeNull()
    expect(focusTaken({ ...tagView, focusedTaskId: 'both', focusedCol: -1 }, 'both', 0)).toBeNull() // first copy by default
  })
})

describe('boardKey', () => {
  const ev = (key: string, over = {}) => ({ key, metaKey: false, ctrlKey: false, altKey: false, repeat: false, defaultPrevented: false, ...over })
  const idle = { busy: false, onControl: false }

  it('passes plain keys through', () => {
    expect(boardKey(ev('j'), idle)).toBe('j')
    expect(boardKey(ev('Enter'), idle)).toBe('Enter')
  })

  it('ignores keys with meta, ctrl or alt held (Cmd+X is not delete, Cmd+K is not up)', () => {
    expect(boardKey(ev('x', { metaKey: true }), idle)).toBeNull()
    expect(boardKey(ev('k', { metaKey: true }), idle)).toBeNull()
    expect(boardKey(ev('d', { ctrlKey: true }), idle)).toBeNull()
    expect(boardKey(ev('j', { altKey: true }), idle)).toBeNull()
  })

  it('ignores everything while a dialog is open or a field has focus', () => {
    for (const key of ['j', 'x', 'd', 'Enter', 'Escape', '2']) expect(boardKey(ev(key), { busy: true, onControl: false })).toBeNull()
  })

  it('ignores a key another handler already consumed', () => {
    expect(boardKey(ev('ArrowDown', { defaultPrevented: true }), idle)).toBeNull()
  })

  it('leaves Enter to a focused button or link (e.g. the Undo button), but still navigates from it', () => {
    expect(boardKey(ev('Enter'), { busy: false, onControl: true })).toBeNull()
    expect(boardKey(ev('j'), { busy: false, onControl: true })).toBe('j')
  })

  it('a held key repeats navigation only: never an action (x would mow down the column, d would flip Done back and forth)', () => {
    for (const key of ['x', 'd', '1', '2', '3', 'Enter']) expect(boardKey(ev(key, { repeat: true }), idle)).toBeNull()
    for (const key of ['j', 'k', 'h', 'l', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) {
      expect(boardKey(ev(key, { repeat: true }), idle)).toBe(key)
    }
  })
})
