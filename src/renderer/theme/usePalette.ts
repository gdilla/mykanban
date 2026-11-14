import { useEffect, useSyncExternalStore } from 'react'
import { useColorMode } from '@chakra-ui/react'
import { palettes, getPalette, defaultPaletteId } from './palettes'

const STORAGE_KEY = 'kanban-palette'
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

// One palette for the whole window, shared by every component that calls usePalette().
// `chosen` is the user's explicit pick; null means "follow the system appearance".
let chosen = localStorage.getItem(STORAGE_KEY)
const listeners = new Set<() => void>()

const currentId = () => getPalette(chosen ?? defaultPaletteId(systemDark.matches)).id

function apply() {
  const palette = getPalette(currentId())
  const mode = palette.isDark ? 'dark' : 'light'
  const root = document.documentElement
  root.setAttribute('data-palette', palette.id)
  root.setAttribute('data-theme', mode)
  root.classList.toggle('chakra-ui-dark', palette.isDark)
  root.classList.toggle('chakra-ui-light', !palette.isDark)
  root.style.colorScheme = mode
  localStorage.setItem('chakra-ui-color-mode', mode)
  listeners.forEach(notify => notify())
}

/** Pick a palette by id, or pass null to go back to following the system appearance. */
export function setPalette(id: string | null) {
  chosen = id
  if (id) localStorage.setItem(STORAGE_KEY, id)
  else localStorage.removeItem(STORAGE_KEY)
  apply()
}

systemDark.addEventListener('change', apply)
apply()

function subscribe(notify: () => void) {
  listeners.add(notify)
  return () => void listeners.delete(notify)
}

export function usePalette() {
  const palette = getPalette(useSyncExternalStore(subscribe, currentId))
  const followsSystem = useSyncExternalStore(subscribe, () => chosen === null)
  const { setColorMode } = useColorMode()

  // Keep Chakra's own light/dark mode in step with the palette
  useEffect(() => {
    setColorMode(palette.isDark ? 'dark' : 'light')
  }, [palette.isDark, setColorMode])

  return { palette, followsSystem, setPalette, palettes }
}
