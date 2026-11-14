import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

// safe-name.js is CommonJS (required by the Electron main process)
const { safeJoin } = createRequire(import.meta.url)('./safe-name.js')

describe('safeJoin', () => {
  it('joins a plain filename onto the directory', () => {
    expect(safeJoin('/data/images', '1707500000_abc123.png')).toBe('/data/images/1707500000_abc123.png')
  })

  it.each([
    ['parent traversal', '../x'],
    ['deep traversal', '../../kanban-data.json'],
    ['nested path', 'a/b'],
    ['absolute path', '/etc/passwd'],
    ['empty string', ''],
    ['the directory itself', '.'],
    ['the parent directory', '..'],
    ['a non-string', undefined],
  ])('rejects %s', (_label, name) => {
    expect(() => safeJoin('/data/images', name)).toThrow('Invalid filename')
  })
})
