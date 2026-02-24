import React from 'react'
import { Box } from '@chakra-ui/react'
import {
  DndContext, DragEndEvent, DragOverlay, closestCenter, DragStartEvent,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { useApp } from '../../state/AppContext'
import StatusView from '../board/StatusView'
import TagView from '../board/TagView'
import DragOverlayCard from '../task/DragOverlay'

export default function Board() {
  const { state, dispatch } = useApp()
  const [activeId, setActiveId] = React.useState<string | null>(null)

  // Require 8px of movement before activating drag — this lets clicks through
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Check if dropped on a column header (status change)
    if (overId.startsWith('column-')) {
      const targetStatus = overId.replace('column-', '') as 'todo' | 'doing' | 'done'
      const task = state.tasks.find(t => t.id === taskId)
      if (task && task.status !== targetStatus) {
        dispatch({ type: 'MOVE_TASK', id: taskId, status: targetStatus })
      }
      return
    }

    // Reorder within or across columns
    const overTask = state.tasks.find(t => t.id === overId)
    const draggedTask = state.tasks.find(t => t.id === taskId)
    if (!overTask || !draggedTask) return

    if (state.currentView === 'status') {
      if (draggedTask.status !== overTask.status) {
        dispatch({ type: 'MOVE_TASK', id: taskId, status: overTask.status })
      }
      // Reorder within column
      const columnTasks = state.tasks
        .filter(t => t.status === overTask.status)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      const ids = columnTasks.map(t => t.id).filter(id => id !== taskId)
      const overIndex = ids.indexOf(overId)
      ids.splice(overIndex, 0, taskId)
      dispatch({ type: 'REORDER_TASKS', columnId: overTask.status, orderedIds: ids, view: 'status' })
    }
  }

  const handleBoardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('board-area') || target.closest('.column-area')) {
      ;(document.activeElement as HTMLElement)?.blur()
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box
        className="board-area"
        onClick={handleBoardClick}
        display="flex"
        gap={6}
        overflowX="auto"
        pb={6}
        minH="calc(100vh - 200px)"
      >
        {state.currentView === 'status' ? <StatusView /> : <TagView />}
      </Box>
      <DragOverlay>
        {activeId ? <DragOverlayCard taskId={activeId} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
