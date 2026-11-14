import { useEffect, useCallback, useRef, createElement } from 'react'
import { flushSync } from 'react-dom'
import { Button, Flex, Text, useToast } from '@chakra-ui/react'
import { useApp } from '../state/AppContext'
import { getVisibleColumns, nextFocus, columnOf, NavKey } from '../state/nav'
import { Task } from '../state/types'
import { colors as c } from '../theme'

const NAV_KEYS: Record<string, NavKey> = {
  ArrowDown: 'down', j: 'down',
  ArrowUp: 'up', k: 'up',
  ArrowLeft: 'left', h: 'left',
  ArrowRight: 'right', l: 'right',
}

const STATUS_KEYS: Record<string, Task['status']> = { '1': 'todo', '2': 'doing', '3': 'done' }

export function useKeyboardNav() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  // Column of the focused card: a task can be on screen more than once in tag view.
  const focusCol = useRef(-1)

  // Every delete (keyboard or mouse) lands in state.lastDeleted, so the undo toast lives here once.
  useEffect(() => {
    const deleted = state.lastDeleted
    if (!deleted) return
    const id = toast({
      duration: 6000,
      position: 'bottom',
      render: ({ onClose }) => createElement(Flex, {
        align: 'center', gap: 3, px: 4, py: 2, bg: c.surface, color: c.text,
        border: `1px solid ${c.borderStrong}`, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        fontFamily: 'body', fontSize: '0.85rem',
      },
        createElement(Text, { flex: 1, noOfLines: 1 }, `Deleted "${deleted.task.title}"`),
        createElement(Button, {
          size: 'sm', variant: 'brutalist-outline',
          onClick: () => { dispatch({ type: 'RESTORE_TASK' }); onClose() },
        }, 'Undo'),
      ),
    })
    // One level of undo: a newer delete (or the undo itself) retires this toast.
    return () => toast.close(id)
  }, [state.lastDeleted, toast, dispatch])

  // Is the keyboard busy elsewhere (typing in a field, or any dialog open)? Sampled in the capture
  // phase, i.e. as the page was when the key went down: a dialog or field that closes on this very
  // key (Escape) is already gone by the time the bubbling handler below runs.
  const busy = useRef(false)
  useEffect(() => {
    const sample = () => {
      const active = document.activeElement as HTMLElement | null
      const isTyping = !!active && (
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.tagName === 'SELECT' ||
        active.contentEditable === 'true'
      )
      // ponytail: "any dialog open" = any role=dialog/alertdialog element in the document (Chakra
      // modals, the confirm dialog, the command palette). An overlay without the role is not seen;
      // move to an open-dialog count in app state if one ever needs to opt in without the role.
      busy.current = isTyping || !!document.querySelector('[role="dialog"], [role="alertdialog"]')
    }
    window.addEventListener('keydown', sample, true)
    return () => window.removeEventListener('keydown', sample, true)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+T for quick add
    if ((e.metaKey || e.ctrlKey) && e.key === 't') {
      e.preventDefault()
      dispatch({ type: 'SET_EDITING_TASK', id: '__quick_add__' })
      return
    }

    // Board shortcuts are plain keys only: Cmd+X, Cmd+K, Ctrl+D etc. belong to someone else,
    // and so does a key another handler already consumed (e.g. a keyboard drag).
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || busy.current) return

    const columns = getVisibleColumns(state)
    // Scroll the focused card into view. In tag view the card can be drawn in several columns;
    // columns render left to right, so the copy we want is the nth one in the document.
    const reveal = (id: string, col: number) => {
      const nth = columns.slice(0, col).filter(ids => ids.includes(id)).length
      document.querySelectorAll('.task-card.focused')[nth]?.scrollIntoView({ block: 'nearest' })
    }

    const navKey = NAV_KEYS[e.key]
    if (navKey) {
      e.preventDefault()
      const next = nextFocus(columns, state.focusedTaskId, navKey, focusCol.current)
      if (!next) return
      focusCol.current = next.col
      flushSync(() => dispatch({ type: 'SET_FOCUSED_TASK', id: next.id })) // render before measuring
      reveal(next.id, next.col)
      return
    }

    if (e.key === 'Escape') {
      dispatch({ type: 'SET_FOCUSED_TASK', id: null })
      return
    }

    // Everything below acts on the focused card, and only if it is actually on screen
    // (never delete or move a card the active filters are hiding).
    const col = columnOf(columns, state.focusedTaskId, focusCol.current)
    const task = col === -1 ? undefined : state.tasks.find(t => t.id === state.focusedTaskId)
    if (!task) return

    const moveTo = (status: Task['status']) => {
      if (task.status === status) return
      flushSync(() => dispatch({ type: 'MOVE_TASK', id: task.id, status }))
      reveal(task.id, state.currentView === 'tags' ? col : 0)
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      dispatch({ type: 'SET_EDITING_TASK', id: task.id })
    } else if (e.key === 'd') {
      e.preventDefault()
      moveTo(task.status === 'done' ? 'todo' : 'done')
    } else if (STATUS_KEYS[e.key]) {
      e.preventDefault()
      moveTo(STATUS_KEYS[e.key])
    } else if (e.key === 'x' && !e.repeat) { // a held key must not mow down the column: undo is one level
      e.preventDefault()
      const row = columns[col].indexOf(task.id)
      const neighbour = columns[col][row + 1] ?? columns[col][row - 1] ?? null
      dispatch({ type: 'DELETE_TASK', id: task.id })
      dispatch({ type: 'SET_FOCUSED_TASK', id: neighbour })
    }
  }, [state, dispatch])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
