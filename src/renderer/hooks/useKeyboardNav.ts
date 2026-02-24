import { useEffect, useCallback } from 'react'
import { useApp } from '../state/AppContext'
import { getFilteredTasks } from '../state/selectors'

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
