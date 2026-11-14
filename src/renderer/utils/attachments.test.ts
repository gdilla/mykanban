import { describe, it, expect } from 'vitest'
import { filesToDelete } from './attachments'
import { Attachment } from '../state/types'

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

  it('save keeps a removed file that another task still references', () => {
    expect(filesToDelete([att('shared.png'), att('old.png')], [], 'save', ['shared.png'])).toEqual(['old.png'])
  })
})
