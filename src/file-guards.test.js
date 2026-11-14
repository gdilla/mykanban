import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

// file-guards.js is CommonJS (required by the Electron main process)
const { safeJoin, isAttachmentReferenced, isSafeToOpen, isAppUrl } = createRequire(import.meta.url)('./file-guards.js')

describe('isSafeToOpen', () => {
  it.each([
    'a.png', 'a.jpg', 'a.jpeg', 'a.gif', 'a.webp', 'a.heic', 'a.bmp', 'a.tiff', 'a.pdf',
    'a.txt', 'a.md', 'a.csv', 'a.json', 'a.log', 'a.doc', 'a.docx', 'a.xls', 'a.xlsx', 'a.ppt', 'a.pptx',
    'a.pages', 'a.numbers', 'a.key', 'a.rtf', 'a.mp3', 'a.m4a', 'a.wav', 'a.mp4', 'a.mov',
    '1707500000_abc123.PNG', 'report.final.Pdf',
  ])('opens the ordinary document %s', name => {
    expect(isSafeToOpen(name)).toBe(true)
  })

  it.each([
    'a.terminal', 'a.command', 'a.jar', 'a.pkg', 'a.app', 'a.inetloc', 'a.sh', 'a.tool', 'a.workflow', 'a.scpt',
    'a.svg', 'a.zip', 'a.html', 'a.bin', 'a.png.terminal', 'a.png.', 'a.png ', 'noextension', '.png', '', undefined,
  ])('does not open %s (it is shown in Finder instead)', name => {
    expect(isSafeToOpen(name)).toBe(false)
  })
})

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

  it('ignores a legacy images list once the task has attachments, as the loader does', () => {
    // a migrated task keeps its old `images` key; the attachment was then removed and saved
    const migrated = { tasks: [{ id: 'd', attachments: [], images: ['legacy.png'] }] }
    expect(isAttachmentReferenced(migrated, 'legacy.png')).toBe(false)
  })

  it('reads the legacy bare-array board format', () => {
    expect(isAttachmentReferenced(board.tasks, 'kept.png')).toBe(true)
    expect(isAttachmentReferenced([], 'kept.png')).toBe(false)
  })
})

describe('isAppUrl', () => {
  const built = 'file:///Applications/Kanban.app/Contents/Resources/app.asar/dist/renderer/index.html'
  const dev = 'http://localhost:5173'

  it.each([
    [built, built],
    [built + '#x', built],
    [dev, dev],
    ['http://localhost:5173/', dev],
    ['http://localhost:5173/#/board', dev],
  ])('allows the app itself: %s', (url, appUrl) => {
    expect(isAppUrl(url, appUrl)).toBe(true)
  })

  it.each([
    ['https://example.com', built],
    ['file:///etc/passwd', built],
    ['file:///Applications/Kanban.app/Contents/Resources/app.asar/dist/renderer/other.html', built],
    ['http://localhost:5174/', dev],
    ['http://localhost:5173/other', dev],
    ['javascript:alert(1)', dev],
    ['not a url', dev],
  ])('blocks %s', (url, appUrl) => {
    expect(isAppUrl(url, appUrl)).toBe(false)
  })
})
