import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { describe, it, expect } from 'vitest'
import { palettes, defaultPaletteId } from './palettes'
import { contrastRatio, luminance } from '../utils/color'

// The palette table lives in global.css as one `[data-palette="<id>"] { --c-*: … }` block per palette.
const css = readFileSync(new URL('../global.css', import.meta.url), 'utf8')

function tokens(id: string): Record<string, string> {
  const block = css.match(new RegExp(`\\[data-palette="${id}"\\]\\s*\\{([^}]*)\\}`))?.[1] ?? ''
  return Object.fromEntries([...block.matchAll(/--c-([\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]))
}

const SURFACES = ['bg', 'surface', 'card', 'card-hover']
// Every token that is used as a text colour on those surfaces.
const TEXT = ['text', 'text-secondary', 'text-muted', 'accent-text', 'todo', 'doing', 'done', 'danger']
const PAIRS: [text: string, surface: string][] = [
  ...TEXT.flatMap(t => SURFACES.map(s => [t, s] as [string, string])),
  ['save-btn-color', 'save-btn-bg'],
  ['save-btn-color', 'save-btn-hover'],
]

describe.each(palettes)('palette $id', ({ id }) => {
  const t = tokens(id)

  it.each(PAIRS)('%s on %s is at least 4.5:1', (text, surface) => {
    expect(t[text], `--c-${text} is not defined`).toMatch(/^#[0-9a-f]{6}$/i)
    expect(t[surface], `--c-${surface} is not defined`).toMatch(/^#[0-9a-f]{6}$/i)
    const ratio = contrastRatio(t[text], t[surface])
    expect(ratio, `${t[text]} on ${t[surface]} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
  })

  it('header surface is not darker than the page', () => {
    expect(luminance(t.surface)).toBeGreaterThanOrEqual(luminance(t.bg))
  })
})

// index.html applies the palette with an inline script before React loads.
describe('boot script in index.html', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const script = html.match(/<script>([\s\S]*?)<\/script>/)![1]

  it('is the only inline script the Content-Security-Policy allows', () => {
    const hash = `'sha256-${createHash('sha256').update(script).digest('base64')}'`
    expect(html.match(/script-src ([^;]+)/)![1]).toBe(`'self' ${hash}`)
  })

  it('agrees with palettes.ts on which palettes are dark and which are the defaults', () => {
    for (const p of palettes) expect(script.includes(`'${p.id}':1`), p.id).toBe(p.isDark)
    expect(script).toContain(`? '${defaultPaletteId(true)}' : '${defaultPaletteId(false)}'`)
  })
})
