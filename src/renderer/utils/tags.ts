import { Tag } from '../state/types'

// Preset tag colours: mid-tones that stay distinct as a dot or a tint on dark and light palettes
// (the chip's text colour is adjusted for contrast separately, see tagTextColor).
export const TAG_COLORS: Record<string, string> = {
  Red: '#ef4444',
  Orange: '#f97316',
  Amber: '#f59e0b',
  Green: '#22c55e',
  Teal: '#14b8a6',
  Blue: '#3b82f6',
  Indigo: '#6366f1',
  Purple: '#a855f7',
  Pink: '#ec4899',
  Slate: '#64748b',
}

/** Why `name` cannot be used for a tag, or null if it can. `selfId` is the tag being renamed. */
export function tagNameError(name: string, tags: Tag[], selfId?: string): string | null {
  const wanted = name.trim().toLowerCase()
  if (!wanted) return 'Give the tag a name.'
  if (tags.some(t => t.id !== selfId && t.name.trim().toLowerCase() === wanted)) {
    return `A tag called “${name.trim()}” already exists.`
  }
  return null
}

/** Colour to offer for a new tag: the first preset no tag uses yet (the first preset once all are taken). */
export function nextTagColor(tags: Tag[]): string {
  const presets = Object.values(TAG_COLORS)
  return presets.find(preset => !tags.some(t => t.color.toLowerCase() === preset)) ?? presets[0]
}
