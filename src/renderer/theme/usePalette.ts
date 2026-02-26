import { useState, useCallback, useEffect } from 'react'
import { useColorMode } from '@chakra-ui/react'
import { palettes, getPalette, defaultPaletteId } from './palettes'
import type { Palette } from './palettes'

const STORAGE_KEY = 'kanban-palette'

function readStoredPalette(): string {
  return localStorage.getItem(STORAGE_KEY) || defaultPaletteId
}

function applyPalette(id: string) {
  const palette = getPalette(id)
  document.documentElement.setAttribute('data-palette', palette.id)
  // Sync Chakra color mode class
  if (palette.isDark) {
    document.documentElement.classList.add('chakra-ui-dark')
    document.documentElement.classList.remove('chakra-ui-light')
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.style.colorScheme = 'dark'
  } else {
    document.documentElement.classList.add('chakra-ui-light')
    document.documentElement.classList.remove('chakra-ui-dark')
    document.documentElement.setAttribute('data-theme', 'light')
    document.documentElement.style.colorScheme = 'light'
  }
  localStorage.setItem(STORAGE_KEY, id)
  localStorage.setItem('chakra-ui-color-mode', palette.isDark ? 'dark' : 'light')
}

export function usePalette() {
  const [paletteId, setPaletteId] = useState(readStoredPalette)
  const { setColorMode } = useColorMode()

  // Apply on mount and when palette changes
  useEffect(() => {
    const palette = getPalette(paletteId)
    applyPalette(paletteId)
    setColorMode(palette.isDark ? 'dark' : 'light')
  }, [paletteId, setColorMode])

  const setPalette = useCallback((id: string) => {
    setPaletteId(id)
  }, [])

  return {
    palette: getPalette(paletteId),
    setPalette,
    palettes,
  }
}
