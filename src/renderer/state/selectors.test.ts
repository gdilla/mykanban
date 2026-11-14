import { describe, it, expect, vi, afterEach } from 'vitest'
import { DONE_LIMIT, getBoardColumns, getDoneTasks } from './selectors'
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

describe('getBoardColumns snapshot', () => {
  afterEach(() => vi.useRealTimers())

  it('gives the view and keyboard navigation the same columns even after an age-filter cutoff has passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-14T12:00:00.000Z'))
    // created 23h59m ago: inside the "1d" filter now, outside it two minutes later
    const young = task('young', { createdAt: '2026-11-13T12:01:00.000Z' })
    const state = board({ tasks: [young], activeFilters: { tags: [], age: '1d' } })
    const drawn = getBoardColumns(state)
    expect(drawn.map(ids)).toEqual([['young'], [], []])

    vi.setSystemTime(new Date('2026-11-14T12:02:00.000Z'))
    // a keypress later: another state object (focus changed), same tasks and filters
    const later = { ...state, focusedTaskId: 'young' }
    expect(getBoardColumns(later)).toBe(drawn)
    expect(getVisibleColumns(later)).toEqual([['young'], [], []])

    // the filter is re-applied as soon as the data or the filters change
    expect(getVisibleColumns({ ...later, tasks: [...later.tasks] })).toEqual([[], [], []])
  })
})
