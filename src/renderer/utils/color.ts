// All helpers take a 6-digit `#rrggbb` colour.
function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

export const isHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value)

/** `fg` at `alpha` (0 to 1) painted over `bg`, the way CSS composites it: per sRGB channel. */
export function blend(fg: string, bg: string, alpha: number): string {
  const [f, b] = [channels(fg), channels(bg)]
  return '#' + f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('')
}

/** WCAG 2.x relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map(v => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2.x contrast ratio between two colours, 1 to 21. Text needs 4.5. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** `a` moved a fraction `t` (0 to 1) of the way towards `b`. */
export function mix(a: string, b: string, t: number): string {
  const to = channels(b)
  return '#' + channels(a).map((v, i) => Math.round(v + (to[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

/**
 * `color` as text: moved towards white or black only as far as it takes to reach `min` contrast
 * on every one of `backgrounds`, so it keeps as much of its hue as legibility allows.
 */
export function readableOn(color: string, backgrounds: string[], min = 4.5): string {
  const worst = (text: string) => Math.min(...backgrounds.map(bg => contrastRatio(text, bg)))
  const pole = worst('#ffffff') >= worst('#000000') ? '#ffffff' : '#000000'
  for (let step = 0; step < 20; step++) {
    const candidate = mix(color, pole, step / 20)
    if (worst(candidate) >= min) return candidate
  }
  return pole
}

/** How strongly a selected tag chip is filled with its tag colour (TagChip.tsx). */
export const TAG_TINT = 0.18

/**
 * Text colour for a tag chip. A tag's colour is whatever the user picked, so it is adjusted to be
 * readable on each of the palette's `surfaces`, both plain (unselected chip) and tinted with the
 * tag colour (selected chip).
 */
export function tagTextColor(color: string, surfaces: string[]): string {
  return readableOn(color, surfaces.flatMap(s => [s, mix(s, color, TAG_TINT)]))
}
