import { describe, it, expect } from 'vitest'
import { appReducer, initialState } from './reducer'
import { getTasksByStatus, getTasksByTag, getUntaggedTasks } from './selectors'
import { resolveDrop, snapDistance, landsAfter, Drop, UNTAGGED } from './drop'
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
const fromTodo = { view: 'status', fromColumnId: 'todo' } as const

describe('resolveDrop — status view', () => {
  it('moves a card to another column, before the card it was dropped on', () => {
    const next = drop(statusBoard(), { ...fromTodo, taskId: 'a', columnId: 'doing', overTaskId: 'y' })
    expect(byId(next, 'a').status).toBe('doing')
    expect(byId(next, 'a').startedAt).not.toBeNull()
    expect(ids(getTasksByStatus(next, 'doing'))).toEqual(['x', 'a', 'y'])
    expect(ids(getTasksByStatus(next, 'todo'))).toEqual(['b', 'c'])
  })

  it('moves a card to the bottom of another column', () => {
    const below = drop(statusBoard(), { ...fromTodo, taskId: 'a', columnId: 'doing', overTaskId: 'y', after: true })
    expect(ids(getTasksByStatus(below, 'doing'))).toEqual(['x', 'y', 'a'])
    const onColumn = drop(statusBoard(), { ...fromTodo, taskId: 'a', columnId: 'doing', overTaskId: null })
    expect(ids(getTasksByStatus(onColumn, 'doing'))).toEqual(['x', 'y', 'a'])
  })

  it('reorders to the last slot of the same column', () => {
    const next = drop(statusBoard(), { ...fromTodo, taskId: 'a', columnId: 'todo', overTaskId: 'c' })
    expect(ids(getTasksByStatus(next, 'todo'))).toEqual(['b', 'c', 'a'])
  })

  it('reorders upwards in the same column', () => {
    const next = drop(statusBoard(), { ...fromTodo, taskId: 'c', columnId: 'todo', overTaskId: 'a' })
    expect(ids(getTasksByStatus(next, 'todo'))).toEqual(['c', 'a', 'b'])
  })

  it('dropping a card on itself is a no-op', () => {
    expect(resolveDrop(statusBoard(), { ...fromTodo, taskId: 'b', columnId: 'todo', overTaskId: 'b' })).toEqual([])
  })

  it('ignores a column that is not a status', () => {
    expect(resolveDrop(statusBoard(), { ...fromTodo, taskId: 'a', columnId: 'tag1', overTaskId: null })).toEqual([])
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
const tagDrag = (taskId: string, fromColumnId: string) => ({ view: 'tags', taskId, fromColumnId }) as const

describe('resolveDrop — tag view', () => {
  it('dropping on a tag column assigns the tag and leaves status alone', () => {
    const tasks = tagBoard()
    const actions = resolveDrop(tasks, { ...tagDrag('d', 't2'), columnId: 't1', overTaskId: null })
    expect(actions.map(a => a.type)).not.toContain('MOVE_TASK')
    const next = actions.reduce(appReducer, { ...initialState, tasks })
    expect(byId(next, 'd').status).toBe('doing')
    expect(byId(next, 'd').tags).toEqual(['t2', 't1'])
    expect(ids(getTasksByTag(next, 't1'))).toEqual(['a', 'b', 'c', 'd'])
    expect(ids(getTasksByTag(next, 't2'))).toEqual(['c', 'd'])
  })

  it('dropping on a card in another tag column inserts at that card', () => {
    const next = drop(tagBoard(), { ...tagDrag('u', UNTAGGED), columnId: 't1', overTaskId: 'b' })
    expect(byId(next, 'u').status).toBe('done')
    expect(byId(next, 'u').tags).toEqual(['t1'])
    expect(ids(getTasksByTag(next, 't1'))).toEqual(['a', 'u', 'b', 'c'])
  })

  it('reorders within a tag column via tagSortOrders, not sortOrder', () => {
    const next = drop(tagBoard(), { ...tagDrag('a', 't1'), columnId: 't1', overTaskId: 'c' })
    expect(ids(getTasksByTag(next, 't1'))).toEqual(['b', 'c', 'a'])
    expect(byId(next, 'c').tagSortOrders.t2).toBe(0)
    expect(next.tasks.map(t => t.sortOrder)).toEqual(tagBoard().map(t => t.sortOrder))
    expect(next.tasks.map(t => t.status)).toEqual(tagBoard().map(t => t.status))
  })

  it('a card dragged from its other tag column into one it is already in lands where it is dropped', () => {
    // c sits last in t1 and first in t2; its t2 copy is dragged into t1
    const d = { ...tagDrag('c', 't2'), columnId: 't1', overTaskId: 'a' }
    const below = drop(tagBoard(), { ...d, after: true })
    expect(ids(getTasksByTag(below, 't1'))).toEqual(['a', 'c', 'b'])
    expect(byId(below, 'c').tags).toEqual(['t1', 't2'])
    expect(ids(getTasksByTag(drop(tagBoard(), d), 't1'))).toEqual(['c', 'a', 'b'])
    expect(resolveDrop(tagBoard(), { ...d, overTaskId: 'c' })).toEqual([])
  })

  it('dropping on the untagged column clears the tags and leaves status alone', () => {
    const next = drop(tagBoard(), { ...tagDrag('d', 't2'), columnId: UNTAGGED, overTaskId: null })
    expect(byId(next, 'd').tags).toEqual([])
    expect(byId(next, 'd').status).toBe('doing')
    expect(ids(getUntaggedTasks(next))).toEqual(['u', 'v', 'd'])
  })

  it('reorders within the untagged column', () => {
    const next = drop(tagBoard(), { ...tagDrag('u', UNTAGGED), columnId: UNTAGGED, overTaskId: 'v' })
    expect(ids(getUntaggedTasks(next))).toEqual(['v', 'u'])
    expect(next.tasks.map(t => t.sortOrder)).toEqual(tagBoard().map(t => t.sortOrder))
  })

  it('the untagged column keeps its sortOrder-based order until it is reordered', () => {
    const tasks = [task('a', { sortOrder: 2 }), task('b', { sortOrder: 0 }), task('c', { sortOrder: 1 })]
    expect(ids(getUntaggedTasks({ ...initialState, tasks }))).toEqual(['b', 'c', 'a'])
    const next = drop(tasks, { ...tagDrag('b', UNTAGGED), columnId: UNTAGGED, overTaskId: 'a' })
    expect(ids(getUntaggedTasks(next))).toEqual(['c', 'a', 'b'])
  })

  it('dropping a card on itself is a no-op', () => {
    expect(resolveDrop(tagBoard(), { ...tagDrag('b', 't1'), columnId: 't1', overTaskId: 'b' })).toEqual([])
  })
})

describe('drop geometry', () => {
  const rect = (top: number, height: number) => ({ top, bottom: top + height, height })
  // three cards, 40 / 160 / 40 px tall, 8 px apart
  const cards = [rect(0, 40), rect(48, 160), rect(216, 40)]

  it('snapDistance is 0 for the card a keyboard move snapped the dragged card onto, whatever the heights', () => {
    // ArrowUp from the last card: its top edge is put on the middle card's top edge
    expect(cards.map(c => snapDistance(rect(48, 40), c))).toEqual([48, 0, 168])
    // ArrowDown from the first card: its bottom edge is put on the middle card's bottom edge
    expect(cards.map(c => snapDistance(rect(168, 40), c))).toEqual([168, 0, 48])
  })

  it('landsAfter: a pointer drop lands below a card once the dragged centre is past its centre', () => {
    expect(landsAfter(rect(100, 40), cards[1], false)).toBe(false)
    expect(landsAfter(rect(120, 40), cards[1], false)).toBe(true)
  })

  it('landsAfter: a keyboard drop lands below the card it is snapped onto, above it from the column top', () => {
    expect(landsAfter(rect(48, 40), cards[1], true)).toBe(true)
    expect(landsAfter(rect(47.9999, 40), cards[1], true)).toBe(true)
    expect(landsAfter(rect(20, 40), cards[1], true)).toBe(false)
  })
})
