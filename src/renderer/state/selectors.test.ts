import { describe, it, expect } from 'vitest'
import { DONE_LIMIT, endOfTagColumn, getBoardColumns, getDoneTasks } from './selectors'
import { getVisibleColumns } from './nav'
import { initialState } from './reducer'
import { AppState, Task } from './types'

const task = (id: string, over: Partial<Task> = {}): Task => ({
  id, title: id, description: '', status: 'todo', dueDate: '', tags: [], attachments: [],
  createdAt: '2026-11-01T00:00:00.000Z', startedAt: null, completedAt: null, timeSpent: 0, sortOrder: 0, tagSortOrders: {},
  ...over,
})
const ids = (tasks: Task[]) => tasks.map(t => t.id)
// d0 was completed first, d14 last; sortOrder runs the other way round on purpose
const done = Array.from({ length: 15 }, (_, i) =>
  task(`d${i}`, { status: 'done', sortOrder: 15 - i, completedAt: `2026-11-${String(i + 1).padStart(2, '0')}T09:00:00.000Z` }))
const board = (over: Partial<AppState> = {}): AppState =>
  ({ ...initialState, tasks: [task('a'), ...done], currentView: 'status', ...over })

describe('getDoneTasks', () => {
  it('shows the most recently completed tasks, newest first, and no more than the limit', () => {
    const shown = getDoneTasks(board())
    expect(shown).toHaveLength(DONE_LIMIT)
    expect(ids(shown)).toEqual(['d14', 'd13', 'd12', 'd11', 'd10', 'd9', 'd8', 'd7', 'd6', 'd5'])
  })

  it('shows every done task, still newest first, once expanded', () => {
    const shown = getDoneTasks(board({ showAllDone: true }))
    expect(ids(shown)).toEqual(done.map(t => t.id).reverse())
  })

  it('puts a done task with no completion time last, in its old order', () => {
    const tasks = [task('old2', { status: 'done', sortOrder: 2 }), task('old1', { status: 'done', sortOrder: 1 }), done[0]]
    expect(ids(getDoneTasks(board({ tasks })))).toEqual(['d0', 'old1', 'old2'])
  })

  it('counts from the filtered list: a hidden task does not use up a slot', () => {
    const tasks = done.map((t, i) => (i % 2 ? { ...t, tags: ['t1'] } : t))
    const shown = getDoneTasks(board({ tasks, activeFilters: { tags: ['t1'], age: null } }))
    expect(ids(shown)).toEqual(['d13', 'd11', 'd9', 'd7', 'd5', 'd3', 'd1'])
  })
})

describe('getBoardColumns', () => {
  it('status view: the Done column is the truncated one, and keyboard navigation sees the same cards', () => {
    const columns = getBoardColumns(board())
    expect(columns.map(ids)).toEqual([['a'], [], ids(getDoneTasks(board()))])
    expect(getVisibleColumns(board())).toEqual(columns.map(ids))
    expect(getVisibleColumns(board({ showAllDone: true }))[2]).toHaveLength(15)
  })

  it('tag view: one column per tag, then untagged; done tasks are not truncated there', () => {
    const tags = [{ id: 't1', name: 'one', color: '#111111' }]
    const tasks = [task('a', { tags: ['t1'] }), ...done]
    const columns = getBoardColumns(board({ tasks, tags, currentView: 'tags' }))
    expect(columns.map(c => c.length)).toEqual([1, 15])
  })
})

describe('endOfTagColumn', () => {
  it('is one past the last card of that tag column', () => {
    const tasks = [task('a', { tags: ['t1'], tagSortOrders: { t1: 4 } }), task('b', { tags: ['t1'] }), task('c', { tags: ['t2'], tagSortOrders: { t2: 9 } })]
    expect(endOfTagColumn(tasks, 't1')).toBe(5)
    expect(endOfTagColumn(tasks, 'empty')).toBe(0)
  })
})
