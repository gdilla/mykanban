import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

// file-guards.js is CommonJS (required by the Electron main process)
const { safeJoin, isAttachmentReferenced } = createRequire(import.meta.url)('./file-guards.js')

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

describe('isAttachmentReferenced', () => {
  const board = {
    tasks: [
      { id: 'a', attachments: [{ filename: 'kept.png', originalName: 'kept.png', type: 'image/png' }] },
      { id: 'b', images: ['legacy.png'] },
      { id: 'c' },
    ],
    tags: [],
  }

  it('is true for a file a saved task still lists', () => {
    expect(isAttachmentReferenced(board, 'kept.png')).toBe(true)
  })

  it('is true for a file in a legacy images list', () => {
    expect(isAttachmentReferenced(board, 'legacy.png')).toBe(true)
  })

  it('is false for a file no saved task lists', () => {
    expect(isAttachmentReferenced(board, 'orphan.png')).toBe(false)
  })

  it('reads the legacy bare-array board format', () => {
    expect(isAttachmentReferenced(board.tasks, 'kept.png')).toBe(true)
    expect(isAttachmentReferenced([], 'kept.png')).toBe(false)
  })
})
