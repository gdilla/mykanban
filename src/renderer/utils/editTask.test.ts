import { describe, it, expect } from 'vitest'
import { filesToDelete, editedFields } from './editTask'
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

  it('changed attachments are written', () => {
    expect(editedFields(opened, { ...draft, attachments: [] }, ['a', 'b'])).toEqual({ attachments: [] })
  })
})
