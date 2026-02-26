import React, { useState } from 'react'
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

  return (
    <Box minH="100vh" p={8} className="app-enter">
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
