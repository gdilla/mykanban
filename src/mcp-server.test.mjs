// End to end: the real server over stdio, driven by the SDK client, against a temp data dir.
// Tests run in order and share one board, like an agent session.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import dates from './dates.js'

const SERVER = fileURLToPath(new URL('./mcp-server.mjs', import.meta.url))
// Optional: path to a real kanban-data.json, to measure output size on real data. Never committed.
const REAL_DATA = process.env.KANBAN_REAL_DATA

const TODAY = dates.localDateStr(new Date())
const HOUR = 3600000

// Shaped like the owner's board at the time of the audit: 58 tasks (24 todo, 1 doing, 33 done), 8 tags
function fixture() {
  const tags = ['Work', 'Home', 'Errands', 'Deep Focus', 'Reading', 'Health', 'Money', 'Someday']
    .map((name, i) => ({ id: `tag${i}`, name, color: `#${i}${i}${i}` }))
  const task = (i, status, over = {}) => ({
    id: `task${String(i).padStart(2, '0')}xxxxxxxxxxxxx`, // real ids are 19 characters
    title: `Task ${i}: review the quarterly onboarding checklist with the whole team`,
    description: 'Background the agent does not need in a list. '.repeat(4),
    status, dueDate: '', tags: [`tag${i % 8}`], attachments: [],
    createdAt: '2026-01-01T00:00:00.000Z', startedAt: null, completedAt: null,
    timeSpent: 0, sortOrder: i, tagSortOrders: {}, ...over,
  })
  const tasks = []
  for (let i = 0; i < 24; i++) tasks.push(task(i, 'todo'))
  tasks.push(task(24, 'doing', { startedAt: new Date(Date.now() - 2 * HOUR).toISOString(), timeSpent: HOUR }))
  for (let i = 25; i < 58; i++) {
    tasks.push(task(i, 'done', { completedAt: new Date(Date.UTC(2026, 0, i)).toISOString() }))
  }
  Object.assign(tasks[0], { dueDate: '2020-01-01', tags: ['tag0', 'tag1'] })
  Object.assign(tasks[1], { dueDate: TODAY, title: 'Call the plumber', description: 'About the LEAK under the sink' })
  tasks[2].attachments = [{ filename: '1700000000_abc.png', originalName: 'screenshot.png', type: 'image/png' }]
  return { tasks, tags }
}

const servers = []
const dirs = []

async function start(dataFile, { relativeDir = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kanban-mcp-'))
  dirs.push(dir)
  const file = path.join(dir, 'kanban-data.json')
  if (dataFile) fs.copyFileSync(dataFile, file)
  else fs.writeFileSync(file, JSON.stringify(fixture(), null, 2))
  const client = new Client({ name: 'test', version: '0' })
  await client.connect(new StdioClientTransport({
    command: process.execPath, args: [SERVER], cwd: path.dirname(dir),
    env: { KANBAN_DATA_DIR: relativeDir ? path.basename(dir) : dir },
  }))
  servers.push(client)
  const call = async (name, args = {}) => {
    const result = await client.callTool({ name, arguments: args })
    const text = result.content[0].text
    return { isError: !!result.isError, text, get json() { return JSON.parse(text) } }
  }
  return { dir, file, client, call }
}

let dir, file, client, call
const onDisk = () => JSON.parse(fs.readFileSync(file, 'utf8'))
const stored = id => onDisk().tasks.find(t => t.id === id)

beforeAll(async () => {
  ({ dir, file, client, call } = await start())
  fs.mkdirSync(path.join(dir, 'summaries'))
  fs.writeFileSync(path.join(dir, 'summaries', 'summary-2026-02-08.md'), '# Daily Summary - 2026-02-08\nolder')
  fs.writeFileSync(path.join(dir, 'summaries', 'summary-2026-02-09.md'), '# Daily Summary - 2026-02-09\nnewest')
})

afterAll(async () => {
  for (const c of servers) await c.close()
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true })
})

describe('tool list', () => {
  it('offers exactly the nine tools, each with a title, a description and honest annotations', async () => {
    const { tools } = await client.listTools()
    expect(tools.map(t => t.name)).toEqual([
      'board_summary', 'list_tasks', 'get_task', 'add_task', 'update_task', 'move_task', 'delete_task', 'list_tags', 'read_summary',
    ])
    for (const tool of tools) {
      expect(tool.title, tool.name).toBeTruthy()
      expect(tool.description.length, tool.name).toBeGreaterThan(20)
    }
    const flagged = hint => tools.filter(t => t.annotations?.[hint]).map(t => t.name)
    expect(flagged('readOnlyHint')).toEqual(['board_summary', 'list_tasks', 'get_task', 'list_tags', 'read_summary'])
    expect(flagged('destructiveHint')).toEqual(['update_task', 'delete_task']) // the two that can lose what the user wrote
    expect(flagged('idempotentHint')).toEqual(['update_task', 'move_task', 'delete_task'])
  })
})

describe('reading', () => {
  it('board_summary: counts, in progress, overdue and due today', async () => {
    const { json, text } = await call('board_summary')
    expect(json).toEqual({
      today: TODAY,
      counts: { todo: 24, doing: 1, done: 33 },
      doing: [{ id: 'task24xxxxxxxxxxxxx', title: expect.stringContaining('Task 24') }],
      overdue: [{ id: 'task00xxxxxxxxxxxxx', title: expect.stringContaining('Task 0'), due: '2020-01-01' }],
      due_today: [{ id: 'task01xxxxxxxxxxxxx', title: 'Call the plumber', due: TODAY }],
    })
    expect(text).not.toContain('\n')
  })

  it('list_tasks with no arguments: open tasks as compact one-line rows, under 6,000 characters for 58 tasks', async () => {
    const { json, text } = await call('list_tasks')
    expect(text.length).toBeLessThan(6000)
    expect(text).not.toContain('\n')
    expect(json.total).toBe(25)
    expect(json.tasks).toHaveLength(25)
    expect(json.tasks[0]).toMatchObject({ id: 'task24xxxxxxxxxxxxx', status: 'doing' })
    expect(json.tasks[1]).toEqual({
      id: 'task00xxxxxxxxxxxxx', title: expect.any(String), status: 'todo', due: '2020-01-01', tags: ['Work', 'Home'],
    })
  })

  it('list_tasks filters: status, tag by name, query, due_before, limit', async () => {
    expect((await call('list_tasks', { status: 'all', limit: 200 })).json.total).toBe(58)
    expect((await call('list_tasks', { status: 'done' })).json.tasks[0].id).toBe('task57xxxxxxxxxxxxx')
    expect((await call('list_tasks', { tag: 'home' })).json.tasks.map(t => t.id))
      .toEqual(['task00xxxxxxxxxxxxx', 'task01xxxxxxxxxxxxx', 'task09xxxxxxxxxxxxx', 'task17xxxxxxxxxxxxx'])
    expect((await call('list_tasks', { query: 'leak' })).json.tasks.map(t => t.title)).toEqual(['Call the plumber'])
    expect((await call('list_tasks', { due_before: TODAY })).json.total).toBe(2)

    const limited = (await call('list_tasks', { limit: 5 })).json
    expect(limited.tasks).toHaveLength(5)
    expect(limited.total).toBe(25)
    expect(limited.note).toMatch(/Showing 5 of 25/)
  })

  it('an unknown tag is an error that lists the valid names', async () => {
    const { isError, text } = await call('list_tasks', { tag: 'tag0' })
    expect(isError).toBe(true)
    expect(text).toBe('Unknown tag "tag0". Valid tags: Work, Home, Errands, Deep Focus, Reading, Health, Money, Someday.')
  })

  it('get_task: the whole task, with attachment paths an agent can open', async () => {
    const { json } = await call('get_task', { id: 'task02xxxxxxxxxxxxx' })
    expect(json).toEqual({
      id: 'task02xxxxxxxxxxxxx', title: expect.stringContaining('Task 2'), status: 'todo', due: null, tags: ['Errands'],
      description: expect.stringContaining('Background'), createdAt: '2026-01-01T00:00:00.000Z',
      startedAt: null, completedAt: null, timeSpentMin: 0,
      attachments: [{ name: 'screenshot.png', type: 'image/png', path: path.join(dir, 'images', '1700000000_abc.png') }],
    })
  })

  it('an unknown id is an error that points at list_tasks', async () => {
    const { isError, text } = await call('get_task', { id: 'nope' })
    expect(isError).toBe(true)
    expect(text).toMatch(/No task with id "nope".*list_tasks/)
  })

  it('list_tags: names, colours and open-task counts', async () => {
    const { json } = await call('list_tags')
    expect(json).toHaveLength(8)
    expect(json[0]).toEqual({ name: 'Work', color: '#000', open: 4 })
    expect(json[1]).toEqual({ name: 'Home', color: '#111', open: 4 })
  })

  it('read_summary: the most recent by default, or one date', async () => {
    expect((await call('read_summary')).text).toBe('# Daily Summary - 2026-02-09\nnewest')
    expect((await call('read_summary', { date: '2026-02-08' })).text).toBe('# Daily Summary - 2026-02-08\nolder')
  })

  it('tools with no required arguments can be called with no arguments object at all', async () => {
    for (const name of ['board_summary', 'list_tasks', 'list_tags', 'read_summary']) {
      const result = await client.callTool({ name })
      expect(result.isError, `${name}: ${result.content[0].text}`).toBeFalsy()
    }
  })

  it('a relative KANBAN_DATA_DIR still gives absolute attachment paths', async () => {
    const relative = await start(undefined, { relativeDir: true })
    const { json } = await relative.call('get_task', { id: 'task02xxxxxxxxxxxxx' })
    expect(json.attachments[0].path).toBe(path.join(fs.realpathSync(relative.dir), 'images', '1700000000_abc.png'))
  })

  it('read_summary: a missing date says which dates exist; anything that is not a date is refused', async () => {
    const missing = await call('read_summary', { date: '2026-03-01' })
    expect(missing.isError).toBe(true)
    expect(missing.text).toMatch(/No summary for 2026-03-01.*2026-02-09, 2026-02-08/)

    const traversal = await call('read_summary', { date: '../kanban-data.json' })
    expect(traversal.isError).toBe(true)
    expect(traversal.text).toMatch(/YYYY-MM-DD/)
  })
})

describe('writing', () => {
  let addedId

  it('add_task takes tag names and stores a complete task the app can read', async () => {
    const { json } = await call('add_task', { title: 'Book dentist', tags: ['health', 'Errands'], due: '2026-12-01', description: 'Ask about Friday' })
    addedId = json.id
    expect(json).toEqual({ id: expect.any(String), title: 'Book dentist', status: 'todo', due: '2026-12-01', tags: ['Health', 'Errands'] })

    expect((await call('get_task', { id: addedId })).json).toMatchObject({ title: 'Book dentist', tags: ['Health', 'Errands'], description: 'Ask about Friday' })
    expect(stored(addedId)).toEqual({
      id: addedId, title: 'Book dentist', description: 'Ask about Friday', status: 'todo', dueDate: '2026-12-01',
      tags: ['tag5', 'tag2'], attachments: [], createdAt: expect.any(String), startedAt: null, completedAt: null,
      timeSpent: 0, sortOrder: 24, tagSortOrders: {},
    })
  })

  it('update_task changes the fields given: new title, cleared due date, replaced tags', async () => {
    const { json } = await call('update_task', { id: addedId, title: 'Book the dentist', due: '', tags: ['Health'] })
    expect(json).toEqual({ id: addedId, title: 'Book the dentist', status: 'todo', due: null, tags: ['Health'] })
    expect(stored(addedId)).toMatchObject({ title: 'Book the dentist', dueDate: '', tags: ['tag5'], description: 'Ask about Friday' })
  })

  it('move_task follows the app rules: doing starts the clock, done records the time, todo resets', async () => {
    const doing = (await call('move_task', { id: addedId, status: 'doing' })).json
    expect(doing).toMatchObject({ status: 'doing', completedAt: null })
    expect(Date.parse(doing.startedAt)).toBeGreaterThan(Date.now() - 60000)
    expect(stored(addedId).sortOrder).toBe(25) // after task 24, the other doing task

    // Task 24 was started two hours ago with one hour already on the clock
    const done = (await call('move_task', { id: 'task24xxxxxxxxxxxxx', status: 'done' })).json
    expect(done.status).toBe('done')
    expect(Date.parse(done.completedAt)).toBeGreaterThan(Date.now() - 60000)
    expect(done.timeSpentMin).toBe(180)
    expect(stored('task24xxxxxxxxxxxxx')).toMatchObject({ status: 'done', sortOrder: 58 })
    expect((await call('list_tasks', { status: 'done', limit: 1 })).json.tasks[0].id).toBe('task24xxxxxxxxxxxxx')

    const todo = (await call('move_task', { id: addedId, status: 'todo' })).json
    expect(todo).toMatchObject({ status: 'todo', startedAt: null, completedAt: null })
  })

  it('move_task to the column a task is already in does not rewrite the file', async () => {
    const before = fs.readFileSync(file, 'utf8')
    const mtime = fs.statSync(file).mtimeMs
    expect((await call('move_task', { id: addedId, status: 'todo' })).json.status).toBe('todo')
    expect(fs.readFileSync(file, 'utf8')).toBe(before)
    expect(fs.statSync(file).mtimeMs).toBe(mtime)
  })

  it('a failed validation leaves the file byte-identical', async () => {
    const before = fs.readFileSync(file)
    const failures = [
      ['add_task', { title: 'x', tags: ['Wrok'] }, /Unknown tag "Wrok". Valid tags: Work, Home/],
      ['add_task', { title: 'x', due: '2026-02-30' }, /YYYY-MM-DD/],
      ['add_task', { title: '  ' }, /title/],
      ['add_task', {}, /title/],
      ['add_task', { title: 'x', status: 'blocked' }, /status/],
      ['update_task', { id: addedId, title: 'changed', tags: ['tag5'] }, /Unknown tag "tag5"/],
      ['update_task', { id: addedId, title: 'changed', due: 'tomorrow' }, /YYYY-MM-DD/],
      ['update_task', { id: addedId }, /move_task/],
      ['update_task', { id: addedId, status: 'done' }, /status/], // status is move_task's job: refused, not silently dropped
      ['update_task', { id: 'nope', title: 'x' }, /list_tasks/],
      ['move_task', { id: 'nope', status: 'done' }, /list_tasks/],
      ['move_task', { id: addedId, status: 'finished' }, /status/],
      ['delete_task', { id: 'nope' }, /list_tasks/],
    ]
    for (const [name, args, message] of failures) {
      const { isError, text } = await call(name, args)
      expect(isError, `${name} ${JSON.stringify(args)}`).toBe(true)
      expect(text).toMatch(message)
    }
    expect(fs.readFileSync(file).equals(before)).toBe(true)
    expect(fs.readdirSync(dir).sort()).toEqual(['kanban-data.json', 'summaries'])
  })

  it('delete_task returns the title it deleted; deleting again is an error', async () => {
    expect((await call('delete_task', { id: addedId })).json).toEqual({ deleted: { id: addedId, title: 'Book the dentist' } })
    expect(stored(addedId)).toBeUndefined()
    expect(onDisk().tasks).toHaveLength(58)
    expect((await call('delete_task', { id: addedId })).isError).toBe(true)
  })

  it('a corrupt data file is an error naming the file, and is not overwritten', async () => {
    const good = fs.readFileSync(file, 'utf8')
    fs.writeFileSync(file, '{ "tasks": [')
    for (const [name, args] of [['list_tasks', {}], ['add_task', { title: 'x' }]]) {
      const { isError, text } = await call(name, args)
      expect(isError).toBe(true)
      expect(text).toContain(file)
    }
    expect(fs.readFileSync(file, 'utf8')).toBe('{ "tasks": [')
    fs.writeFileSync(file, good)
  })
})

describe('real data', () => {
  it.runIf(REAL_DATA)('default list_tasks and board_summary stay small on a copy of the real board', async () => {
    const real = await start(REAL_DATA)
    const list = await real.call('list_tasks')
    const summary = await real.call('board_summary')
    console.log(`real data: list_tasks ${list.text.length} chars (${list.json.total} open), board_summary ${summary.text.length} chars`)
    expect(list.text.length).toBeLessThan(6000)
    expect(summary.text.length).toBeLessThan(6000)
    expect(fs.readFileSync(real.file).equals(fs.readFileSync(REAL_DATA))).toBe(true)
  })
})
