import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { palettes } from '../../theme/palettes'
import { blend, contrastRatio } from '../../utils/color'
import { TAG_LABEL, TAG_TINT } from './TaskTags'

// Palette tokens live in global.css, one `[data-palette="<id>"] { --c-*: … }` block per palette.
const css = readFileSync(new URL('../../global.css', import.meta.url), 'utf8')
const token = (id: string, name: string) =>
  css.match(new RegExp(`\\[data-palette="${id}"\\]\\s*\\{[^}]*--c-${name}:\\s*(#[0-9a-f]{6})`, 'i'))![1]
const label = TAG_LABEL.match(/var\(--c-([\w-]+)\)/)![1]

// A tag can be any colour. White and black give the lightest and the darkest chip there can be,
// so if the label is readable on both it is readable on every colour in between.
describe.each(palettes)('tag chip label in palette $id', ({ id }) => {
  it.each([
    ['#ffffff', 'card'], ['#ffffff', 'card-hover'], ['#000000', 'card'], ['#000000', 'card-hover'],
  ])('a %s tag on %s is at least 4.5:1', (tagColor, surface) => {
    const chip = blend(tagColor, token(id, surface), TAG_TINT)
    const ratio = contrastRatio(token(id, label), chip)
    expect(ratio, `--c-${label} on ${chip} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
  })
})
