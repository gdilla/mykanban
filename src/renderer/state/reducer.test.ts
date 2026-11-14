import { describe, it, expect } from 'vitest'
import { appReducer, initialState } from './reducer'
import { Task } from './types'

describe('appReducer', () => {
  it('SET_DATA loads tasks and tags', () => {
    const next = appReducer(initialState, { type: 'SET_DATA', tasks: [], tags: [{ id: 't1', name: 'x', color: '#fff' }] } as any)
    expect(next.tags).toHaveLength(1)
    expect(next.tasks).toEqual([])
  })

  it('SET_DATA repairs a status that is not todo/doing/done to todo', () => {
    const tasks = [{ id: 'a', status: 'mkohl2jwshr9tgpt60e' }, { id: 'b', status: 'done' }, { id: 'c' }]
    const next = appReducer(initialState, { type: 'SET_DATA', tasks, tags: [] } as any)
    expect(next.tasks.map(t => t.status)).toEqual(['todo', 'done', 'todo'])
  })

  it('SET_DATA marks the board as loaded (until then the columns are not drawn)', () => {
    expect(initialState.loaded).toBe(false)
    expect(appReducer(initialState, { type: 'SET_DATA', tasks: [], tags: [] }).loaded).toBe(true)
  })

  it('SET_FOCUSED_TASK remembers the column the card was focused in, or -1 when not told', () => {
    const inColumn = appReducer(initialState, { type: 'SET_FOCUSED_TASK', id: 'a', col: 2 })
    expect([inColumn.focusedTaskId, inColumn.focusedCol]).toEqual(['a', 2])
    const anywhere = appReducer(inColumn, { type: 'SET_FOCUSED_TASK', id: 'b' })
    expect([anywhere.focusedTaskId, anywhere.focusedCol]).toEqual(['b', -1])
  })

  it('SET_SHOW_ALL_DONE expands and collapses the Done column', () => {
    expect(initialState.showAllDone).toBe(false)
    const open = appReducer(initialState, { type: 'SET_SHOW_ALL_DONE', show: true })
    expect(open.showAllDone).toBe(true)
    expect(appReducer(open, { type: 'SET_SHOW_ALL_DONE', show: false }).showAllDone).toBe(false)
  })

  it('MOVE_TASK ignores a status that is not todo/doing/done', () => {
    const state = { ...initialState, tasks: [{ id: 'a', status: 'doing', sortOrder: 3 }] } as any
    expect(appReducer(state, { type: 'MOVE_TASK', id: 'a', status: 'mkohl2jwshr9tgpt60e' } as any)).toBe(state)
  })
})

describe('delete and restore', () => {
  const task = (id: string, sortOrder: number): Task => ({
    id, title: `Task ${id}`, description: 'notes', status: 'doing', dueDate: '2026-11-20', tags: ['t1'],
    attachments: [{ filename: 'f.png', originalName: 'shot.png', type: 'image/png' }],
    createdAt: '2026-11-01T10:00:00.000Z', startedAt: '2026-11-02T10:00:00.000Z', completedAt: null,
    timeSpent: 1234, sortOrder, tagSortOrders: { t1: 2 },
  })
  const loaded = { ...initialState, tags: [{ id: 't1', name: 'one', color: '#111' }], tasks: [task('a', 0), task('b', 1), task('c', 2)] }

  it('DELETE_TASK removes the task and remembers it', () => {
    const next = appReducer(loaded, { type: 'DELETE_TASK', id: 'b' })
    expect(next.tasks.map(t => t.id)).toEqual(['a', 'c'])
    expect(next.lastDeleted).toEqual({ task: loaded.tasks[1], index: 1 })
  })

  it('RESTORE_TASK puts it back at its original position with every field intact', () => {
    const deleted = appReducer(loaded, { type: 'DELETE_TASK', id: 'b' })
    const restored = appReducer(deleted, { type: 'RESTORE_TASK', id: 'b' })
    expect(restored.tasks).toEqual(loaded.tasks)
    expect(restored.lastDeleted).toBeNull()
  })

  it('RESTORE_TASK restores only the most recent delete, once', () => {
    const twice = appReducer(appReducer(loaded, { type: 'DELETE_TASK', id: 'a' }), { type: 'DELETE_TASK', id: 'c' })
    // Undo for the older delete (its toast is on the way out) must not restore the newer one.
    expect(appReducer(twice, { type: 'RESTORE_TASK', id: 'a' })).toBe(twice)
    const restored = appReducer(twice, { type: 'RESTORE_TASK', id: 'c' })
    expect(restored.tasks.map(t => t.id)).toEqual(['b', 'c'])
    expect(appReducer(restored, { type: 'RESTORE_TASK', id: 'c' })).toBe(restored)
  })

  it('RESTORE_TASK drops tags that were deleted in the meantime, so the task stays visible in tag view', () => {
    const tags = [{ id: 't1', name: 'one', color: '#111' }, { id: 't2', name: 'two', color: '#222' }]
    const both = { ...task('z', 3), tags: ['t1', 't2'] }
    let state = appReducer({ ...loaded, tags, tasks: [...loaded.tasks, both] }, { type: 'DELETE_TASK', id: 'z' })
    state = appReducer(state, { type: 'DELETE_TAG', id: 't1' })
    state = appReducer(state, { type: 'RESTORE_TASK', id: 'z' })
    const restored = state.tasks.find(t => t.id === 'z')!
    expect(restored.tags).toEqual(['t2'])
    expect(restored.tagSortOrders).toEqual({}) // no place left in the dead tag's column; none invented for t2
  })

  it('RESTORE_TASK puts back the very task that was deleted when its tags are all still there (so delete + Undo leaves the file as it was)', () => {
    // old data: no recorded place in its tag column, and a leftover entry
    const old = { ...task('u', 3), tagSortOrders: { untagged: 0 } }
    const deleted = appReducer({ ...loaded, tasks: [...loaded.tasks, old] }, { type: 'DELETE_TASK', id: 'u' })
    expect(appReducer(deleted, { type: 'RESTORE_TASK', id: 'u' }).tasks[3]).toBe(old)
  })

  it('DELETE_TAG takes the tasks\' place in that tag column with it, and leaves the other tasks alone', () => {
    const other = { ...task('o', 9), tags: ['t2'], tagSortOrders: { t2: 5 } }
    const next = appReducer({ ...loaded, tasks: [...loaded.tasks, other] }, { type: 'DELETE_TAG', id: 't1' })
    expect(next.tasks.map(t => [t.tags, t.tagSortOrders])).toEqual([[[], {}], [[], {}], [[], {}], [['t2'], { t2: 5 }]])
    expect(next.tasks[3]).toBe(other)
  })

  it('FORGET_DELETED ends the offer of Undo for that delete (its files are about to go), but not for a newer one', () => {
    const deleted = appReducer(loaded, { type: 'DELETE_TASK', id: 'b' })
    const forgotten = appReducer(deleted, { type: 'FORGET_DELETED', id: 'b' })
    expect(forgotten.lastDeleted).toBeNull()
    expect(appReducer(forgotten, { type: 'RESTORE_TASK', id: 'b' })).toBe(forgotten)
    const newer = appReducer(deleted, { type: 'DELETE_TASK', id: 'c' })
    expect(appReducer(newer, { type: 'FORGET_DELETED', id: 'b' })).toBe(newer)
  })

  it('DELETE_TASK for an unknown id changes nothing', () => {
    expect(appReducer(loaded, { type: 'DELETE_TASK', id: 'nope' })).toBe(loaded)
  })

  it('RESTORE_TASK does not duplicate a task that is already back (e.g. an external reload)', () => {
    const deleted = appReducer(loaded, { type: 'DELETE_TASK', id: 'b' })
    const reloaded = { ...deleted, tasks: loaded.tasks }
    expect(appReducer(reloaded, { type: 'RESTORE_TASK', id: 'b' }).tasks.map(t => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('RESTORE_TASK clamps the position when the list has shrunk', () => {
    const deleted = appReducer(loaded, { type: 'DELETE_TASK', id: 'c' })
    const shrunk = { ...deleted, tasks: [] }
    expect(appReducer(shrunk, { type: 'RESTORE_TASK', id: 'c' }).tasks.map(t => t.id)).toEqual(['c'])
  })
})

describe('tag filters follow the tags', () => {
  const tags = [{ id: 't1', name: 'Work', color: '#111' }, { id: 't2', name: 'Home', color: '#222' }]
  const filtering = { ...initialState, tags, activeFilters: { tags: ['t1', 't2'], age: '1w' } }

  it('DELETE_TAG also switches off the filter on that tag (its chip is gone, so nothing else could)', () => {
    const next = appReducer(filtering, { type: 'DELETE_TAG', id: 't1' })
    expect(next.activeFilters).toEqual({ tags: ['t2'], age: '1w' })
  })

  it('SET_DATA drops filters on tags that no longer exist (an agent deleted the tag)', () => {
    const next = appReducer(filtering, { type: 'SET_DATA', tasks: [], tags: [tags[1]] })
    expect(next.activeFilters).toEqual({ tags: ['t2'], age: '1w' })
  })
})
