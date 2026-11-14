import { describe, it, expect } from 'vitest'
import { appReducer, initialState } from './reducer'
import { getTasksByStatus, getTasksByTag, getUntaggedTasks } from './selectors'
import { resolveDrop, Drop, UNTAGGED } from './drop'
import { AppState, Task } from './types'

const task = (id: string, over: Partial<Task> = {}): Task => ({
  id, title: id, description: '', status: 'todo', dueDate: '', tags: [], attachments: [],
  createdAt: '', startedAt: null, completedAt: null, timeSpent: 0, sortOrder: 0, tagSortOrders: {},
  ...over,
})

// Resolve the drop, run its actions through the real reducer, and read the board back through the selectors.
const drop = (tasks: Task[], d: Drop): AppState =>
  resolveDrop(tasks, d).reduce(appReducer, { ...initialState, tasks })
const ids = (tasks: Task[]) => tasks.map(t => t.id)
const byId = (state: AppState, id: string) => state.tasks.find(t => t.id === id)!

const statusBoard = () => [
  task('a', { sortOrder: 0 }), task('b', { sortOrder: 1 }), task('c', { sortOrder: 2 }),
  task('x', { status: 'doing', sortOrder: 0 }), task('y', { status: 'doing', sortOrder: 1 }),
]

describe('resolveDrop — status view', () => {
  it('moves a card to another column, before the card it was dropped on', () => {
    const next = drop(statusBoard(), { view: 'status', taskId: 'a', columnId: 'doing', overTaskId: 'y' })
    expect(byId(next, 'a').status).toBe('doing')
    expect(byId(next, 'a').startedAt).not.toBeNull()
    expect(ids(getTasksByStatus(next, 'doing'))).toEqual(['x', 'a', 'y'])
    expect(ids(getTasksByStatus(next, 'todo'))).toEqual(['b', 'c'])
  })

  it('moves a card to the bottom of another column', () => {
    const below = drop(statusBoard(), { view: 'status', taskId: 'a', columnId: 'doing', overTaskId: 'y', after: true })
    expect(ids(getTasksByStatus(below, 'doing'))).toEqual(['x', 'y', 'a'])
    const onColumn = drop(statusBoard(), { view: 'status', taskId: 'a', columnId: 'doing', overTaskId: null })
    expect(ids(getTasksByStatus(onColumn, 'doing'))).toEqual(['x', 'y', 'a'])
  })

  it('reorders to the last slot of the same column', () => {
    const next = drop(statusBoard(), { view: 'status', taskId: 'a', columnId: 'todo', overTaskId: 'c' })
    expect(ids(getTasksByStatus(next, 'todo'))).toEqual(['b', 'c', 'a'])
  })

  it('reorders upwards in the same column', () => {
    const next = drop(statusBoard(), { view: 'status', taskId: 'c', columnId: 'todo', overTaskId: 'a' })
    expect(ids(getTasksByStatus(next, 'todo'))).toEqual(['c', 'a', 'b'])
  })

  it('dropping a card on itself is a no-op', () => {
    expect(resolveDrop(statusBoard(), { view: 'status', taskId: 'b', columnId: 'todo', overTaskId: 'b' })).toEqual([])
  })

  it('ignores a column that is not a status', () => {
    expect(resolveDrop(statusBoard(), { view: 'status', taskId: 'a', columnId: 'tag1', overTaskId: null })).toEqual([])
  })
})

const tagBoard = () => [
  task('a', { tags: ['t1'], tagSortOrders: { t1: 0 }, sortOrder: 7 }),
  task('b', { tags: ['t1'], tagSortOrders: { t1: 1 }, sortOrder: 8 }),
  task('c', { tags: ['t1', 't2'], tagSortOrders: { t1: 2, t2: 0 }, sortOrder: 9 }),
  task('d', { tags: ['t2'], tagSortOrders: { t2: 1 }, status: 'doing' }),
  task('u', { status: 'done' }),
  task('v'),
]

describe('resolveDrop — tag view', () => {
  it('dropping on a tag column assigns the tag and leaves status alone', () => {
    const tasks = tagBoard()
    const actions = resolveDrop(tasks, { view: 'tags', taskId: 'd', columnId: 't1', overTaskId: null })
    expect(actions.map(a => a.type)).not.toContain('MOVE_TASK')
    const next = actions.reduce(appReducer, { ...initialState, tasks })
    expect(byId(next, 'd').status).toBe('doing')
    expect(byId(next, 'd').tags).toEqual(['t2', 't1'])
    expect(ids(getTasksByTag(next, 't1'))).toEqual(['a', 'b', 'c', 'd'])
    expect(ids(getTasksByTag(next, 't2'))).toEqual(['c', 'd'])
  })

  it('dropping on a card in another tag column inserts at that card', () => {
    const next = drop(tagBoard(), { view: 'tags', taskId: 'u', columnId: 't1', overTaskId: 'b' })
    expect(byId(next, 'u').status).toBe('done')
    expect(byId(next, 'u').tags).toEqual(['t1'])
    expect(ids(getTasksByTag(next, 't1'))).toEqual(['a', 'u', 'b', 'c'])
  })

  it('reorders within a tag column via tagSortOrders, not sortOrder', () => {
    const next = drop(tagBoard(), { view: 'tags', taskId: 'a', columnId: 't1', overTaskId: 'c' })
    expect(ids(getTasksByTag(next, 't1'))).toEqual(['b', 'c', 'a'])
    expect(byId(next, 'c').tagSortOrders.t2).toBe(0)
    expect(next.tasks.map(t => t.sortOrder)).toEqual(tagBoard().map(t => t.sortOrder))
    expect(next.tasks.map(t => t.status)).toEqual(tagBoard().map(t => t.status))
  })

  it('dropping on the untagged column clears the tags and leaves status alone', () => {
    const next = drop(tagBoard(), { view: 'tags', taskId: 'd', columnId: UNTAGGED, overTaskId: null })
    expect(byId(next, 'd').tags).toEqual([])
    expect(byId(next, 'd').status).toBe('doing')
    expect(ids(getUntaggedTasks(next))).toEqual(['u', 'v', 'd'])
  })

  it('reorders within the untagged column', () => {
    const next = drop(tagBoard(), { view: 'tags', taskId: 'u', columnId: UNTAGGED, overTaskId: 'v' })
    expect(ids(getUntaggedTasks(next))).toEqual(['v', 'u'])
    expect(next.tasks.map(t => t.sortOrder)).toEqual(tagBoard().map(t => t.sortOrder))
  })

  it('dropping a card on itself is a no-op', () => {
    expect(resolveDrop(tagBoard(), { view: 'tags', taskId: 'b', columnId: 't1', overTaskId: 'b' })).toEqual([])
  })
})
