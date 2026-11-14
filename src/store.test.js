import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import store from './store.js'

let dir, file
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kanban-store-'))
  file = path.join(dir, 'kanban-data.json')
})

const board = { tasks: [{ id: 'a', title: 'one', status: 'todo' }], tags: [{ id: 't', name: 'x', color: '#fff' }] }

describe('store', () => {
  it('round-trips a board', () => {
    store.save(file, board)
    expect(store.load(file)).toEqual(board)
  })

  it('treats a missing file as an empty board', () => {
    expect(store.load(file)).toEqual({ tasks: [], tags: [] })
    expect(store.read(file)).toBeNull()
  })

  it('throws on a corrupt file instead of returning an empty board', () => {
    fs.writeFileSync(file, '{ "tasks": [')
    expect(() => store.load(file)).toThrow()
  })

  it('throws on valid JSON that is not a board', () => {
    fs.writeFileSync(file, 'null')
    expect(() => store.load(file)).toThrow()
  })

  it('reads the legacy bare-array format', () => {
    fs.writeFileSync(file, JSON.stringify(board.tasks))
    expect(store.load(file)).toEqual({ tasks: board.tasks, tags: [] })
  })

  it('reads legacy `content` tasks as title + description, without rewriting the file', () => {
    const legacy = JSON.stringify({ tasks: [{ id: 'a', content: 'old title', status: 'doing' }, { id: 'b', title: 'new', description: 'd' }], tags: [] })
    fs.writeFileSync(file, legacy)
    expect(store.load(file).tasks).toEqual([
      { id: 'a', title: 'old title', description: '', status: 'doing' },
      { id: 'b', title: 'new', description: 'd' },
    ])
    expect(fs.readFileSync(file, 'utf8')).toBe(legacy)
  })

  it('leaves no temp file behind', () => {
    store.save(file, board)
    expect(fs.readdirSync(dir)).toEqual(['kanban-data.json'])
  })

  it('save creates the data directory when it does not exist yet (the app has never run)', () => {
    const fresh = path.join(dir, 'never', 'run', 'kanban-data.json')
    store.save(fresh, board)
    expect(store.load(fresh)).toEqual(board)
  })

  it('save returns the exact text now on disk', () => {
    expect(store.save(file, board)).toBe(fs.readFileSync(file, 'utf8'))
  })
})

describe('stale-write guard', () => {
  it('isStale compares disk text with the last text the app saw', () => {
    expect(store.isStale('a', 'a')).toBe(false)
    expect(store.isStale('b', 'a')).toBe(true)
    expect(store.isStale(null, null)).toBe(false) // no file then, no file now
    expect(store.isStale('a', null)).toBe(true) // file appeared
  })

  it('after a failed load (nothing seen) every file state is stale, so nothing is saved over it', () => {
    expect(store.isStale('{ "tasks": [', undefined)).toBe(true)
    expect(store.isStale(null, undefined)).toBe(true)
    fs.writeFileSync(file, '{ "tasks": [')
    expect(store.saveIfFresh(file, board, undefined)).toBeNull()
    expect(fs.readFileSync(file, 'utf8')).toBe('{ "tasks": [')
  })

  it('writes when the file is what the app last saw', () => {
    const seen = store.save(file, board)
    const next = { ...board, tags: [] }
    expect(store.saveIfFresh(file, next, seen)).toBe(store.read(file))
    expect(store.load(file)).toEqual(next)
  })

  it('refuses when something else changed the file, and leaves it alone', () => {
    const seen = store.save(file, board)
    const external = { tasks: [...board.tasks, { id: 'b', title: 'from an agent', status: 'todo' }], tags: board.tags }
    store.save(file, external)
    expect(store.saveIfFresh(file, { tasks: [], tags: [] }, seen)).toBeNull()
    expect(store.load(file)).toEqual(external)
  })
})
