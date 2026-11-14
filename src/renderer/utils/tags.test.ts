import { describe, it, expect } from 'vitest'
import { tagNameError, nextTagColor, TAG_COLORS } from './tags'
import { isHex } from './color'

const tags = [
  { id: 'a', name: 'webapp', color: '#6bcb77' },
  { id: 'b', name: 'Kiosk', color: '#a855f7' },
]

describe('tagNameError', () => {
  it('accepts a new name', () => {
    expect(tagNameError('Design', tags)).toBeNull()
  })

  it('rejects an empty or blank name', () => {
    expect(tagNameError('', tags)).toMatch(/name/i)
    expect(tagNameError('   ', tags)).toMatch(/name/i)
  })

  it('rejects a name another tag has, whatever the case or padding', () => {
    expect(tagNameError('kiosk', tags)).toMatch(/already/)
    expect(tagNameError('  WEBAPP ', tags)).toMatch(/already/)
  })

  it('lets a tag keep or re-case its own name when renaming', () => {
    expect(tagNameError('Kiosk', tags, 'b')).toBeNull()
    expect(tagNameError('KIOSK', tags, 'b')).toBeNull()
    expect(tagNameError('webapp', tags, 'b')).toMatch(/already/)
  })
})

describe('TAG_COLORS', () => {
  it('is ten distinct 6-digit hex colours', () => {
    const values = Object.values(TAG_COLORS)
    expect(values).toHaveLength(10)
    expect(new Set(values).size).toBe(10)
    values.forEach(v => expect(isHex(v), v).toBe(true))
  })
})

describe('nextTagColor', () => {
  const presets = Object.values(TAG_COLORS)
  const withColours = (colours: string[]) => colours.map((color, i) => ({ id: String(i), name: String(i), color }))

  it('is the first preset when there are no tags', () => {
    expect(nextTagColor([])).toBe(presets[0])
  })

  it('skips presets that tags already use', () => {
    expect(nextTagColor(withColours([presets[0], presets[1], '#123456']))).toBe(presets[2])
    expect(nextTagColor(withColours([presets[1]]))).toBe(presets[0])
  })

  it('starts again from the first preset once all are in use', () => {
    expect(nextTagColor(withColours(presets))).toBe(presets[0])
  })
})
