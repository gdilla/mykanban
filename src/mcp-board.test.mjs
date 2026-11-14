import { describe, it, expect } from 'vitest'
import {
  checkDate, tagIds, listTasks, boardSummary, taskDetail, addTask, updateTask, moveTask, deleteTask, listTags,
} from './mcp-board.mjs'

const NOW = Date.parse('2026-11-14T10:00:00.000Z')
const TODAY = '2026-11-14'

const tags = [
  { id: 'g1', name: 'Work', color: '#f00' },
  { id: 'g2', name: 'Home', color: '#0f0' },
  { id: 'g3', name: 'Deep Focus', color: '#00f' },
]

const task = (id, over = {}) => ({
  id, title: `Task ${id}`, description: '', status: 'todo', dueDate: '', tags: [], attachments: [],
  createdAt: '2026-11-01T00:00:00.000Z', startedAt: null, completedAt: null,
  timeSpent: 0, sortOrder: 0, tagSortOrders: {}, ...over,
})

const board = () => ({
  tags: structuredClone(tags),
  tasks: [
    task('t2', { sortOrder: 2, tags: ['g1'], dueDate: '2026-11-10' }),
    task('t1', { sortOrder: 1, tags: ['g1', 'g2'], dueDate: '2026-11-14', description: 'Call the PLUMBER' }),
    task('d1', { status: 'doing', startedAt: '2026-11-14T08:00:00.000Z', tags: ['g3'], dueDate: '2026-11-20' }),
    task('x1', { status: 'done', completedAt: '2026-11-10T00:00:00.000Z', dueDate: '2026-11-01' }),
    task('x2', { status: 'done', completedAt: '2026-11-12T00:00:00.000Z', tags: ['g1'] }),
    task('t3', { sortOrder: 3, dueDate: null }),
  ],
})

const ids = result => result.tasks.map(t => t.id)

describe('checkDate', () => {
  it('accepts a real YYYY-MM-DD date', () => {
    expect(checkDate('2026-02-28')).toBe('2026-02-28')
    expect(checkDate('2028-02-29')).toBe('2028-02-29')
  })

  it.each(['2026-02-30', '2026-13-01', '2026-00-10', '2026-1-5', '14/11/2026', 'tomorrow', '2026-11-14T10:00:00Z', ''])(
    'rejects %j and says what is expected', bad => {
      expect(() => checkDate(bad)).toThrow(/YYYY-MM-DD/)
    })
})

describe('tagIds', () => {
  it('resolves names to ids, ignoring case and surrounding space, without duplicates', () => {
    expect(tagIds(['work', ' HOME ', 'Work', 'deep focus'], tags)).toEqual(['g1', 'g2', 'g3'])
  })

  it('an unknown name is an error that lists the valid names', () => {
    expect(() => tagIds(['Work', 'Wrok'], tags)).toThrow('Unknown tag "Wrok". Valid tags: Work, Home, Deep Focus.')
  })

  it('a tag id is not a name', () => {
    expect(() => tagIds(['g1'], tags)).toThrow(/Unknown tag "g1"/)
  })

  // The app's tag manager allows two tags with the same name, or names that differ only in case
  it('prefers an exact-case match, so the names the server returns always resolve to the same tag', () => {
    const twins = [{ id: 'a', name: 'Work', color: '#f00' }, { id: 'b', name: 'work', color: '#0f0' }]
    expect(tagIds(['Work'], twins)).toEqual(['a'])
    expect(tagIds(['work'], twins)).toEqual(['b'])
  })

  it('refuses a name that matches more than one tag instead of picking one', () => {
    const twins = [{ id: 'a', name: 'Work', color: '#f00' }, { id: 'b', name: 'work', color: '#0f0' }]
    expect(() => tagIds(['WORK'], twins)).toThrow('Tag name "WORK" is ambiguous: it matches "Work" and "work". Use the exact name, or rename one in the Kanban app.')
    const same = [{ id: 'a', name: 'Work', color: '#f00' }, { id: 'b', name: 'Work', color: '#0f0' }]
    expect(() => tagIds(['Work'], same)).toThrow(/ambiguous/)
    expect(() => listTasks({ tasks: [], tags: same }, { tag: 'work' })).toThrow(/ambiguous/)
  })

  it('finds a tag whose stored name has surrounding spaces (older tags were saved verbatim)', () => {
    const padded = { id: 'p', name: ' Work ', color: '#f00' }
    expect(tagIds([' Work '], [padded])).toEqual(['p'])
    expect(tagIds(['work'], [padded])).toEqual(['p'])
    const both = [padded, { id: 'q', name: 'Work', color: '#0f0' }]
    expect(tagIds([' Work '], both)).toEqual(['p'])
    expect(tagIds(['Work'], both)).toEqual(['q'])
  })

  it('says so when the board has no tags', () => {
    expect(() => tagIds(['x'], [])).toThrow(/no tags/)
  })
})

describe('listTasks', () => {
  it('defaults to open tasks as compact rows with tag names: doing first, then todo by sortOrder', () => {
    const result = listTasks(board())
    expect(ids(result)).toEqual(['d1', 't1', 't2', 't3'])
    expect(result.total).toBe(4)
    expect(result.tasks[1]).toEqual({ id: 't1', title: 'Task t1', status: 'todo', due: '2026-11-14', tags: ['Work', 'Home'] })
    expect(result.tasks[3]).toEqual({ id: 't3', title: 'Task t3', status: 'todo', due: null, tags: [] })
    expect(result.note).toBeUndefined()
  })

  it('filters by status; done is most recently completed first; all puts done last', () => {
    expect(ids(listTasks(board(), { status: 'todo' }))).toEqual(['t1', 't2', 't3'])
    expect(ids(listTasks(board(), { status: 'doing' }))).toEqual(['d1'])
    expect(ids(listTasks(board(), { status: 'done' }))).toEqual(['x2', 'x1'])
    expect(ids(listTasks(board(), { status: 'all' }))).toEqual(['d1', 't1', 't2', 't3', 'x2', 'x1'])
  })

  it('filters by tag name, case-insensitively', () => {
    expect(ids(listTasks(board(), { tag: 'work' }))).toEqual(['t1', 't2'])
    expect(ids(listTasks(board(), { tag: 'WORK', status: 'all' }))).toEqual(['t1', 't2', 'x2'])
  })

  it('an unknown tag is an error, not an empty list', () => {
    expect(() => listTasks(board(), { tag: 'g1' })).toThrow(/Valid tags: Work, Home, Deep Focus/)
  })

  it('query matches title or description, case-insensitively', () => {
    expect(ids(listTasks(board(), { query: 'plumber' }))).toEqual(['t1'])
    expect(ids(listTasks(board(), { query: 'TASK T3' }))).toEqual(['t3'])
    expect(listTasks(board(), { query: 'nothing like this' })).toEqual({ tasks: [], total: 0 })
  })

  it('due_before is inclusive and skips tasks with no due date', () => {
    expect(ids(listTasks(board(), { due_before: '2026-11-14' }))).toEqual(['t1', 't2'])
    expect(ids(listTasks(board(), { due_before: '2026-11-13' }))).toEqual(['t2'])
    expect(() => listTasks(board(), { due_before: 'friday' })).toThrow(/due_before.*YYYY-MM-DD/)
  })

  it('limits the rows and says how many there are in total', () => {
    const result = listTasks(board(), { status: 'all', limit: 2 })
    expect(ids(result)).toEqual(['d1', 't1'])
    expect(result.total).toBe(6)
    expect(result.note).toMatch(/Showing 2 of 6/)
  })

  it('defaults to 50 rows', () => {
    const many = { tags: [], tasks: Array.from({ length: 120 }, (_, i) => task(`m${i}`, { sortOrder: i })) }
    const result = listTasks(many)
    expect(result.tasks).toHaveLength(50)
    expect(result.total).toBe(120)
    expect(result.note).toMatch(/Showing 50 of 120/)
  })

  it('shows a task whose status is not a real status as todo (the app repairs it the same way)', () => {
    const b = { tags: [], tasks: [task('odd', { status: 'g1' })] }
    expect(listTasks(b).tasks[0]).toMatchObject({ id: 'odd', status: 'todo' })
    expect(boardSummary(b, TODAY).counts).toEqual({ todo: 1, doing: 0, done: 0 })
  })

  it('leaves out tag ids that no longer exist', () => {
    const b = { tags, tasks: [task('a', { tags: ['gone', 'g2'] })] }
    expect(listTasks(b).tasks[0].tags).toEqual(['Home'])
  })
})

describe('boardSummary', () => {
  it('counts each column and lists what is in progress, overdue and due today', () => {
    expect(boardSummary(board(), TODAY)).toEqual({
      today: TODAY,
      counts: { todo: 3, doing: 1, done: 2 },
      doing: [{ id: 'd1', title: 'Task d1' }],
      overdue: [{ id: 't2', title: 'Task t2', due: '2026-11-10' }],
      due_today: [{ id: 't1', title: 'Task t1', due: '2026-11-14' }],
    })
  })
})

describe('taskDetail', () => {
  it('returns the whole task with tag names, minutes spent and absolute attachment paths', () => {
    const b = board()
    b.tasks[1].timeSpent = 90 * 60000
    b.tasks[1].attachments = [{ filename: '170_abc.png', originalName: 'shot.png', type: 'image/png' }]
    expect(taskDetail(b, 't1', '/data/images')).toEqual({
      id: 't1', title: 'Task t1', status: 'todo', due: '2026-11-14', tags: ['Work', 'Home'],
      description: 'Call the PLUMBER', createdAt: '2026-11-01T00:00:00.000Z', startedAt: null, completedAt: null,
      timeSpentMin: 90,
      attachments: [{ name: 'shot.png', type: 'image/png', path: '/data/images/170_abc.png' }],
    })
  })

  it('shows legacy `images` (filenames only) as attachments, as the app does', () => {
    const b = { tags: [], tasks: [{ id: 'old', title: 'Old', status: 'todo', images: ['170_old.png'] }] }
    expect(taskDetail(b, 'old', '/data/images').attachments).toEqual([
      { name: '170_old.png', type: 'image/png', path: '/data/images/170_old.png' },
    ])
  })

  it('an unknown id is an error that points at list_tasks', () => {
    expect(() => taskDetail(board(), 'nope', '/x')).toThrow('No task with id "nope". Call list_tasks to find the right id.')
  })
})

describe('addTask', () => {
  it('adds a todo task at the end of its column, with tags given by name', () => {
    const b = board()
    const row = addTask(b, { title: '  Buy milk ', tags: ['home'], due: '2026-11-20', description: 'oat' }, NOW)
    expect(row).toEqual({ id: expect.any(String), title: 'Buy milk', status: 'todo', due: '2026-11-20', tags: ['Home'] })
    expect(b.tasks.at(-1)).toEqual({
      id: row.id, title: 'Buy milk', description: 'oat', status: 'todo', dueDate: '2026-11-20', tags: ['g2'],
      attachments: [], createdAt: '2026-11-14T10:00:00.000Z', startedAt: null, completedAt: null,
      timeSpent: 0, sortOrder: 4, tagSortOrders: {},
    })
  })

  it.each([
    [{ title: 'x', tags: ['Nope'] }, /Unknown tag "Nope"/],
    [{ title: 'x', due: '2026-02-31' }, /YYYY-MM-DD/],
    [{ title: '   ' }, /title/],
  ])('rejects %j and adds nothing', (fields, message) => {
    const b = board()
    expect(() => addTask(b, fields, NOW)).toThrow(message)
    expect(b).toEqual(board())
  })
})

describe('updateTask', () => {
  it('changes only the fields given; tags replace the set', () => {
    const b = board()
    const row = updateTask(b, 't1', { title: 'New title', tags: ['Deep Focus'] })
    expect(row).toEqual({ id: 't1', title: 'New title', status: 'todo', due: '2026-11-14', tags: ['Deep Focus'] })
    expect(b.tasks[1]).toEqual({ ...board().tasks[1], title: 'New title', tags: ['g3'] })
  })

  it('an empty string or null clears the due date; an empty list clears the tags', () => {
    const b = board()
    expect(updateTask(b, 't1', { due: '' }).due).toBeNull()
    expect(b.tasks[1].dueDate).toBe('')
    expect(updateTask(b, 't2', { due: null, tags: [] })).toMatchObject({ due: null, tags: [] })
  })

  it.each([
    ['t1', { tags: ['Nope'], title: 'changed' }, /Unknown tag "Nope"/],
    ['t1', { due: 'soon', title: 'changed' }, /YYYY-MM-DD/],
    ['t1', { title: '' }, /title/],
    ['t1', {}, /move_task/],
    ['nope', { title: 'x' }, /list_tasks/],
  ])('rejects %s %j and changes nothing', (id, changes, message) => {
    const b = board()
    expect(() => updateTask(b, id, changes)).toThrow(message)
    expect(b).toEqual(board())
  })
})

describe('moveTask', () => {
  it('applies the shared status rules: done stamps completedAt and adds the time spent', () => {
    const b = board()
    expect(moveTask(b, 'd1', 'done', NOW)).toEqual({
      id: 'd1', title: 'Task d1', status: 'done',
      startedAt: '2026-11-14T08:00:00.000Z', completedAt: '2026-11-14T10:00:00.000Z', timeSpentMin: 120,
    })
    expect(b.tasks[2]).toMatchObject({ status: 'done', timeSpent: 2 * 3600000, sortOrder: 1 })
  })

  it('moving a task to the column it is already in changes nothing', () => {
    const b = board()
    expect(moveTask(b, 't1', 'todo', NOW)).toMatchObject({ id: 't1', status: 'todo' })
    expect(b).toEqual(board())
  })

  it('an unknown id is an error', () => {
    expect(() => moveTask(board(), 'nope', 'done', NOW)).toThrow(/list_tasks/)
  })
})

describe('deleteTask', () => {
  it('removes the task and returns its title', () => {
    const b = board()
    expect(deleteTask(b, 't2')).toEqual({ deleted: { id: 't2', title: 'Task t2' } })
    expect(b.tasks.map(t => t.id)).toEqual(['t1', 'd1', 'x1', 'x2', 't3'])
    expect(() => deleteTask(b, 't2')).toThrow(/list_tasks/)
  })
})

describe('listTags', () => {
  it('lists each tag by name with its colour and number of open tasks', () => {
    expect(listTags(board())).toEqual([
      { name: 'Work', color: '#f00', open: 2 },
      { name: 'Home', color: '#0f0', open: 1 },
      { name: 'Deep Focus', color: '#00f', open: 1 },
    ])
  })
})
