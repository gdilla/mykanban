export interface Palette {
  id: string
  name: string
  isDark: boolean
  preview: string // accent/brand color for the dot preview
}

export const palettes: Palette[] = [
  { id: 'linear', name: 'Linear', isDark: true, preview: '#5e6ad2' },
  { id: 'github-dark', name: 'GitHub Dark', isDark: true, preview: '#58a6ff' },
  { id: 'vercel', name: 'Vercel', isDark: true, preview: '#ffffff' },
  { id: 'spotify', name: 'Spotify', isDark: true, preview: '#1db954' },
  { id: 'slack', name: 'Slack', isDark: true, preview: '#e01e5a' },
  { id: 'notion', name: 'Notion', isDark: false, preview: '#37352f' },
  { id: 'arc', name: 'Arc', isDark: false, preview: '#007aff' },
]

export const defaultPaletteId = 'linear'

export function getPalette(id: string): Palette {
  return palettes.find(p => p.id === id) ?? palettes[0]
}
