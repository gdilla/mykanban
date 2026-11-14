import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { palettes } from '../theme/palettes'
import { contrastRatio, mix, isHex, readableOn, tagTextColor, TAG_TINT } from './color'

describe('mix', () => {
  it('moves one colour towards another', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000')
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mix('#ff0000', '#0000ff', 0.25)).toBe('#bf0040')
  })
})

describe('isHex', () => {
  it('accepts only 6-digit hex colours', () => {
    expect(isHex('#6bcb77')).toBe(true)
    expect(isHex('#ABCDEF')).toBe(true)
    expect(isHex('#fff')).toBe(false)
    expect(isHex('red')).toBe(false)
    expect(isHex('')).toBe(false)
  })
})

describe('readableOn', () => {
  it('leaves a colour that is already readable untouched', () => {
    expect(readableOn('#ffffff', ['#000000'])).toBe('#ffffff')
    expect(readableOn('#6bcb77', ['#151620'])).toBe('#6bcb77')
  })

  it('lightens a dark colour on a dark background, keeping its hue', () => {
    const text = readableOn('#1e3a8a', ['#151620'])
    expect(contrastRatio(text, '#151620')).toBeGreaterThanOrEqual(4.5)
    const [r, g, b] = [1, 3, 5].map(i => parseInt(text.slice(i, i + 2), 16))
    expect(b).toBeGreaterThan(r) // still blue
    expect(b).toBeGreaterThan(g)
  })

  it('darkens a light colour on a light background', () => {
    const text = readableOn('#fde047', ['#ffffff', '#f0efe9'])
    expect(contrastRatio(text, '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(text, '#f0efe9')).toBeGreaterThanOrEqual(4.5)
  })

  it('falls back to whichever of black and white contrasts more when the target is out of reach', () => {
    expect(readableOn('#808080', ['#777777'], 21)).toBe('#000000')
    expect(readableOn('#808080', ['#707070'], 21)).toBe('#ffffff')
  })
})

// A tag's colour is user data: its chip must stay readable in every palette, on every surface,
// selected (tinted with the tag colour) or not.
describe('tagTextColor', () => {
  const css = readFileSync(new URL('../global.css', import.meta.url), 'utf8')
  const surfacesOf = (id: string) => {
    const block = css.match(new RegExp(`\\[data-palette="${id}"\\]\\s*\\{([^}]*)\\}`))![1]
    return ['bg', 'surface', 'card', 'card-hover'].map(s => block.match(new RegExp(`--c-${s}:\\s*(#[0-9a-f]{6})`, 'i'))![1])
  }
  const TAG_COLOURS = [
    '#000000', '#ffffff', '#ffff00', '#000080', '#808080', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6',
    '#6bcb77', '#a855f7', '#6c7fcb', '#4ecdc4', '#cb6c9f', // the colours in the owner's data
  ]

  it.each(palettes.map(p => p.id))('is at least 4.5:1 on plain and tinted surfaces in %s', id => {
    const surfaces = surfacesOf(id)
    expect(surfaces).toHaveLength(4)
    for (const colour of TAG_COLOURS) {
      const text = tagTextColor(colour, surfaces)
      for (const surface of surfaces) {
        for (const bg of [surface, mix(surface, colour, TAG_TINT)]) {
          const ratio = contrastRatio(text, bg)
          expect(ratio, `${colour} tag → ${text} on ${bg} (${id}) is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
  })
})
