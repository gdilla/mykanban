import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { appReducer, initialState } from '../renderer/state/reducer'
import { applyStatusChange, newTask, withTagOrders } from './task-rules.mjs'

const NOW = Date.parse('2026-11-14T10:00:00.000Z')
const NOW_ISO = '2026-11-14T10:00:00.000Z'
const TWO_HOURS_AGO = '2026-11-14T08:00:00.000Z'
const HOUR = 3600000

const task = (over: Record<string, unknown> = {}): any => ({
  id: 'a', title: 't', description: 'd', status: 'todo', dueDate: '2026-12-01', tags: ['g1'], attachments: [],
  createdAt: '2026-11-01T00:00:00.000Z', startedAt: null, completedAt: null,
  timeSpent: 0, sortOrder: 0, tagSortOrders: { g1: 3 }, ...over,
})

// The same cases run through the app's reducer and through the shared function:
// the MCP server and the app must apply one set of rules.
const implementations: [string, (tasks: any[], id: string, status: string) => any][] = [
  ['reducer MOVE_TASK', (tasks, id, status) =>
    appReducer({ ...initialState, tasks }, { type: 'MOVE_TASK', id, status } as any).tasks.find(t => t.id === id)],
  ['shared applyStatusChange', (tasks, id, status) =>
    applyStatusChange(tasks.find(t => t.id === id), status, tasks, NOW)],
]

describe.each(implementations)('status change via %s', (_name, move) => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW) })
  afterEach(() => { vi.useRealTimers() })

  it('todo -> doing starts the clock', () => {
    const t = task()
    expect(move([t], 'a', 'doing')).toEqual({ ...t, status: 'doing', startedAt: NOW_ISO, sortOrder: 0 })
  })

  it('doing -> done stamps completedAt and adds the elapsed time to timeSpent', () => {
    const t = task({ status: 'doing', startedAt: TWO_HOURS_AGO, timeSpent: HOUR })
    expect(move([t], 'a', 'done')).toEqual({ ...t, status: 'done', completedAt: NOW_ISO, timeSpent: 3 * HOUR, sortOrder: 0 })
  })

  it('doing -> done treats a missing timeSpent as zero', () => {
    const t = task({ status: 'doing', startedAt: TWO_HOURS_AGO, timeSpent: null })
    expect(move([t], 'a', 'done').timeSpent).toBe(2 * HOUR)
  })

  it('todo -> done (never started) completes without touching timeSpent or startedAt', () => {
    const t = task({ timeSpent: 5 })
    expect(move([t], 'a', 'done')).toEqual({ ...t, status: 'done', completedAt: NOW_ISO, sortOrder: 0 })
  })

  it('done -> todo clears both timestamps and keeps timeSpent', () => {
    const t = task({ status: 'done', startedAt: TWO_HOURS_AGO, completedAt: TWO_HOURS_AGO, timeSpent: HOUR })
    expect(move([t], 'a', 'todo')).toEqual({ ...t, status: 'todo', startedAt: null, completedAt: null, sortOrder: 0 })
  })

  it('doing -> todo clears startedAt', () => {
    const t = task({ status: 'doing', startedAt: TWO_HOURS_AGO })
    expect(move([t], 'a', 'todo')).toEqual({ ...t, status: 'todo', startedAt: null, completedAt: null, sortOrder: 0 })
  })

  it('done -> doing restarts the clock and (current app behaviour) keeps completedAt', () => {
    const t = task({ status: 'done', startedAt: TWO_HOURS_AGO, completedAt: TWO_HOURS_AGO, timeSpent: HOUR })
    expect(move([t], 'a', 'doing')).toEqual({ ...t, status: 'doing', startedAt: NOW_ISO, sortOrder: 0 })
  })

  it('doing -> doing keeps startedAt; done -> done keeps completedAt and timeSpent', () => {
    const doing = task({ status: 'doing', startedAt: TWO_HOURS_AGO })
    expect(move([doing], 'a', 'doing').startedAt).toBe(TWO_HOURS_AGO)
    const done = task({ status: 'done', startedAt: TWO_HOURS_AGO, completedAt: TWO_HOURS_AGO, timeSpent: HOUR })
    expect(move([done], 'a', 'done')).toMatchObject({ completedAt: TWO_HOURS_AGO, timeSpent: HOUR })
  })

  it('lands at the end of the target column', () => {
    const tasks = [
      task(),
      task({ id: 'b', status: 'doing', sortOrder: 4 }),
      task({ id: 'c', status: 'doing', sortOrder: 7 }),
      task({ id: 'd', status: 'done', sortOrder: 99 }),
    ]
    expect(move(tasks, 'a', 'doing').sortOrder).toBe(8)
  })

  it('an empty target column starts at 0; a missing sortOrder counts as 0', () => {
    expect(move([task({ sortOrder: 5 })], 'a', 'done').sortOrder).toBe(0)
    expect(move([task(), task({ id: 'b', status: 'done', sortOrder: undefined })], 'a', 'done').sortOrder).toBe(1)
  })

  it('a same-column move goes after the highest sortOrder, its own included', () => {
    const tasks = [task({ sortOrder: 5 }), task({ id: 'b', sortOrder: 2 })]
    expect(move(tasks, 'a', 'todo').sortOrder).toBe(6)
    expect(move(tasks, 'b', 'todo').sortOrder).toBe(6)
  })

  it('does not mutate the task it was given', () => {
    const t = task()
    const before = JSON.stringify(t)
    move([t], 'a', 'done')
    expect(JSON.stringify(t)).toBe(before)
  })
})

describe('newTask', () => {
  const others = [task({ sortOrder: 3 }), task({ id: 'b', status: 'done', sortOrder: 9 })]

  it('has the field set and defaults the app writes for a new task', () => {
    const t = newTask({ title: 'Write report' }, others, NOW)
    expect(t).toEqual({
      id: expect.any(String), title: 'Write report', description: '', status: 'todo', dueDate: '', tags: [],
      attachments: [], createdAt: NOW_ISO, startedAt: null, completedAt: null,
      timeSpent: 0, sortOrder: 4, tagSortOrders: {},
    })
    expect(t.id).not.toBe(newTask({ title: 'x' }, others, NOW).id)
  })

  it('keeps the fields it is given', () => {
    const t = newTask({ title: 'x', description: 'why', dueDate: '2026-12-24', tags: ['g1'] }, [], NOW)
    expect(t).toMatchObject({ description: 'why', dueDate: '2026-12-24', tags: ['g1'], sortOrder: 0 })
  })

  it('created in doing it is started; created in done it is completed (as the app does)', () => {
    expect(newTask({ title: 'x', status: 'doing' }, others, NOW)).toMatchObject({ startedAt: NOW_ISO, completedAt: null, sortOrder: 0 })
    expect(newTask({ title: 'x', status: 'done' }, others, NOW)).toMatchObject({ startedAt: null, completedAt: NOW_ISO, sortOrder: 10 })
  })
})

describe('withTagOrders', () => {
  // The g1 column has been reordered (p, then q); q is also second in g2
  const board = [
    task({ id: 'p', tags: ['g1'], tagSortOrders: { g1: 0 } }),
    task({ id: 'q', tags: ['g1', 'g2'], tagSortOrders: { g1: 7, g2: 2 } }),
  ]

  it('puts a task at the bottom of every tag column it has no place in yet', () => {
    const t = withTagOrders(task({ id: 'n', tags: ['g1', 'g2', 'g3'], tagSortOrders: {} }), board)
    expect(t.tagSortOrders).toEqual({ g1: 8, g2: 3, g3: 0 })
  })

  it('keeps the place it already has in a column', () => {
    const t = withTagOrders(task({ id: 'n', tags: ['g1', 'g2'], tagSortOrders: { g1: 0 } }), board)
    expect(t.tagSortOrders).toEqual({ g1: 0, g2: 3 })
  })

  it('drops its place in tag columns it has left, but keeps its place among the untagged', () => {
    const t = withTagOrders(task({ id: 'q', tags: ['g2'], tagSortOrders: { g1: 7, g2: 2, __untagged__: 4 } }), board)
    expect(t.tagSortOrders).toEqual({ g2: 2, __untagged__: 4 })
  })

  it('reads a task from an old file (no tagSortOrders) and does not change the task it is given', () => {
    const old = task({ id: 'n', tags: ['g1'], tagSortOrders: undefined })
    const before = JSON.stringify(old)
    expect(withTagOrders(old, [...board, old]).tagSortOrders).toEqual({ g1: 8 })
    expect(JSON.stringify(old)).toBe(before)
  })

  it('the reducer applies it when a task is added with tags (quick add) or its tags are edited', () => {
    const state = { ...initialState, tasks: board }
    const added = appReducer(state, { type: 'ADD_TASK', task: task({ id: 'n', tags: ['g1'], tagSortOrders: {} }) })
    expect(added.tasks[2].tagSortOrders).toEqual({ g1: 8 })

    const retagged = appReducer(state, { type: 'UPDATE_TASK', id: 'p', updates: { tags: ['g2'] } })
    expect(retagged.tasks[0].tagSortOrders).toEqual({ g2: 3 })

    // An update that does not set tags leaves the order alone
    const renamed = appReducer(state, { type: 'UPDATE_TASK', id: 'q', updates: { title: 'renamed' } })
    expect(renamed.tasks[1].tagSortOrders).toBe(board[1].tagSortOrders)
  })
})
