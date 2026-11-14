import { describe, it, expect } from 'vitest'
import { filesToDelete, editedFields, orphanedFiles } from './editTask'
import { Attachment, Task } from '../state/types'

const att = (filename: string): Attachment => ({ filename, originalName: filename, type: 'image/png' })

describe('filesToDelete', () => {
  it('cancel deletes a file added in this session', () => {
    expect(filesToDelete([att('old.png')], [att('old.png'), att('new.png')], 'cancel')).toEqual(['new.png'])
  })

  it('save deletes a file that was removed', () => {
    expect(filesToDelete([att('old.png'), att('keep.png')], [att('keep.png')], 'save')).toEqual(['old.png'])
  })

  it('save with one added and one removed deletes only the removed one', () => {
    expect(filesToDelete([att('old.png')], [att('new.png')], 'save')).toEqual(['old.png'])
  })

  it('cancel with a removed pre-existing file deletes nothing', () => {
    expect(filesToDelete([att('old.png')], [], 'cancel')).toEqual([])
  })
})

describe('editedFields', () => {
  const opened = {
    title: 'Write spec', description: 'details', dueDate: '2026-11-20',
    tags: ['a', 'b'], attachments: [att('old.png')],
  } as Task
  const draft = { ...opened }

  it('an untouched draft writes nothing', () => {
    expect(editedFields(opened, draft, ['a', 'b'])).toEqual({})
  })

  it('returns only the fields that changed, with the title trimmed', () => {
    expect(editedFields(opened, { ...draft, title: '  Write the spec ', dueDate: '' }, ['a', 'b']))
      .toEqual({ title: 'Write the spec', dueDate: '' })
  })

  it('an emptied title keeps the previous title', () => {
    expect(editedFields(opened, { ...draft, title: '   ', description: 'new' }, ['a', 'b'])).toEqual({ description: 'new' })
  })

  it('edited tags never write back a tag that no longer exists', () => {
    // tag "a" was deleted (by an agent) while the window was open; the user then deselected "b"
    expect(editedFields(opened, { ...draft, tags: ['a'] }, ['b'])).toEqual({ tags: [] })
  })

  it('a tag switched off and on again, or attachments rebuilt with the same files, is not an edit', () => {
    expect(editedFields(opened, { ...draft, tags: ['b', 'a'], attachments: [att('old.png')] }, ['a', 'b'])).toEqual({})
  })

  it('changed attachments are written', () => {
    expect(editedFields(opened, { ...draft, attachments: [] }, ['a', 'b'])).toEqual({ attachments: [] })
  })
})

describe('orphanedFiles', () => {
  const withFiles = (id: string, ...files: string[]) => ({ id, attachments: files.map(att) }) as Task
  const deleted = withFiles('gone', 'a.png', 'b.pdf')

  // lastDeleted is still this task when its Undo toast times out
  const expired = (tasks: Task[]) => ({ tasks, lastDeleted: { task: deleted, index: 0 } })

  it('a deleted task leaves all of its files behind when nothing else uses them', () => {
    expect(orphanedFiles(deleted, expired([withFiles('other', 'c.png'), withFiles('bare')]))).toEqual(['a.png', 'b.pdf'])
  })

  it('keeps a file another task still shows (a duplicate shares its files)', () => {
    expect(orphanedFiles(deleted, expired([withFiles('copy', 'a.png')]))).toEqual(['b.pdf'])
  })

  it('keeps everything when the task is back on the board (Undo, or a reload from disk)', () => {
    expect(orphanedFiles(deleted, { tasks: [withFiles('other'), deleted], lastDeleted: null })).toEqual([])
  })

  it('keeps a file shown by a task deleted since, which Undo can still bring back', () => {
    // the task and its duplicate were deleted one after the other: the second delete retired the first toast
    const copy = withFiles('copy', 'a.png')
    expect(orphanedFiles(deleted, { tasks: [], lastDeleted: { task: copy, index: 0 } })).toEqual(['b.pdf'])
    // ...and when the copy's own toast times out, nothing shows a.png any more
    expect(orphanedFiles(copy, { tasks: [], lastDeleted: { task: copy, index: 0 } })).toEqual(['a.png'])
  })
})
