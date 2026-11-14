import React, { useEffect, useState } from 'react'
import { Box } from '@chakra-ui/react'
import { useApp } from './state/AppContext'
import { useKeyboardNav } from './hooks/useKeyboardNav'
import Header from './components/layout/Header'
import FilterBar from './components/layout/FilterBar'
import Board from './components/layout/Board'
import EditTaskModal from './components/modals/EditTaskModal'
import QuickAddModal from './components/modals/QuickAddModal'
import TagManagerModal from './components/modals/TagManagerModal'
import SummaryViewerModal from './components/modals/SummaryViewerModal'
import CommandPalette from './components/shared/CommandPalette'

export default function App() {
  const { state } = useApp()
  const [showFilters, setShowFilters] = useState(false)
  useKeyboardNav()

  // The command palette shows or hides the filter bar with a window event, as it opens the dialogs:
  // `detail` true shows it, no detail toggles it.
  useEffect(() => {
    const toggle = (e: Event) => setShowFilters(shown => (e as CustomEvent<boolean | null>).detail ?? !shown)
    window.addEventListener('toggle-filters', toggle)
    return () => window.removeEventListener('toggle-filters', toggle)
  }, [])

  return (
    <Box h="100vh" display="flex" flexDir="column" overflow="hidden">
      <Header showFilters={showFilters} onToggleFilters={() => setShowFilters(f => !f)} />
      {showFilters && <FilterBar />}
      <Board />
      <EditTaskModal />
      <QuickAddModal />
      <TagManagerModal />
      <SummaryViewerModal />
      <CommandPalette />
    </Box>
  )
}
