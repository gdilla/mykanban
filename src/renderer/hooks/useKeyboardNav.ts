import { useEffect, useCallback } from 'react'
import { useApp } from '../state/AppContext'
import { getFilteredTasks, getTasksByStatus } from '../state/selectors'

const COLUMN_ORDER = ['todo', 'doing', 'done'] as const

export function useKeyboardNav() {
  const { state, dispatch } = useApp()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if typing in input
    const active = document.activeElement as HTMLElement
    const isTyping = active && (
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.contentEditable === 'true'
    )

    // Cmd+T for quick add
    if ((e.metaKey || e.ctrlKey) && e.key === 't') {
      e.preventDefault()
      dispatch({ type: 'SET_EDITING_TASK', id: '__quick_add__' })
      return
    }

    // Skip nav if modal open or typing
    const anyModalOpen = !!state.editingTaskId
    if (anyModalOpen || isTyping) return

    const tasks = getFilteredTasks(state)
    if (tasks.length === 0) return

    const currentIndex = state.focusedTaskId
      ? tasks.findIndex(t => t.id === state.focusedTaskId)
      : -1

    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault()
      const next = currentIndex < tasks.length - 1 ? currentIndex + 1 : 0
      dispatch({ type: 'SET_FOCUSED_TASK', id: tasks[next].id })
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault()
      const prev = currentIndex > 0 ? currentIndex - 1 : tasks.length - 1
      dispatch({ type: 'SET_FOCUSED_TASK', id: tasks[prev].id })
    } else if (e.key === 'ArrowLeft' || e.key === 'h') {
      e.preventDefault()
      moveFocusToColumn(-1, state, dispatch)
    } else if (e.key === 'ArrowRight' || e.key === 'l') {
      e.preventDefault()
      moveFocusToColumn(1, state, dispatch)
    } else if (e.key === 'Enter' && state.focusedTaskId) {
      e.preventDefault()
      dispatch({ type: 'SET_EDITING_TASK', id: state.focusedTaskId })
    } else if (e.key === 'd' && state.focusedTaskId) {
      e.preventDefault()
      const task = tasks.find(t => t.id === state.focusedTaskId)
      if (task) {
        const newStatus = task.status === 'done' ? 'todo' : 'done'
        dispatch({ type: 'MOVE_TASK', id: state.focusedTaskId, status: newStatus })
      }
    } else if (e.key === 'x' && state.focusedTaskId) {
      e.preventDefault()
      dispatch({ type: 'DELETE_TASK', id: state.focusedTaskId })
    } else if (e.key === 'Escape') {
      dispatch({ type: 'SET_FOCUSED_TASK', id: null })
    }
  }, [state, dispatch])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

function moveFocusToColumn(direction: -1 | 1, state: ReturnType<typeof useApp>['state'], dispatch: ReturnType<typeof useApp>['dispatch']) {
  const focusedTask = state.focusedTaskId
    ? state.tasks.find(t => t.id === state.focusedTaskId)
    : null

  if (!focusedTask) {
    // No focus — focus first task in first column
    const firstCol = getTasksByStatus(state, 'todo')
    if (firstCol.length > 0) dispatch({ type: 'SET_FOCUSED_TASK', id: firstCol[0].id })
    return
  }

  const currentColIndex = COLUMN_ORDER.indexOf(focusedTask.status as typeof COLUMN_ORDER[number])
  const targetColIndex = currentColIndex + direction
  if (targetColIndex < 0 || targetColIndex >= COLUMN_ORDER.length) return

  const targetStatus = COLUMN_ORDER[targetColIndex]
  const targetTasks = getTasksByStatus(state, targetStatus)
  if (targetTasks.length === 0) return

  // Find the index of the focused task in its current column
  const currentColTasks = getTasksByStatus(state, focusedTask.status)
  const indexInCol = currentColTasks.findIndex(t => t.id === focusedTask.id)
  const targetIndex = Math.min(indexInCol, targetTasks.length - 1)

  dispatch({ type: 'SET_FOCUSED_TASK', id: targetTasks[targetIndex].id })
}
