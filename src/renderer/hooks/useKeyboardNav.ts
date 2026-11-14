import { useEffect, useCallback, useRef, createElement } from 'react'
import { flushSync } from 'react-dom'
import { Button, Flex, Text, useToast } from '@chakra-ui/react'
import { useApp } from '../state/AppContext'
import { getVisibleColumns, nextFocus, focusedColumn, boardKey, NAV_KEYS } from '../state/nav'
import { Task } from '../state/types'
import { orphanedFiles } from '../utils/editTask'
import { deleteFilesAfterSave } from './useIpc'
import { colors as c } from '../theme'

const STATUS_KEYS: Record<string, Task['status']> = { '1': 'todo', '2': 'doing', '3': 'done' }

export function useKeyboardNav() {
  const { state, dispatch } = useApp()
  const toast = useToast()

  const tasks = useRef(state.tasks)
  tasks.current = state.tasks

  // Every delete (keyboard or mouse) lands in state.lastDeleted, so the undo toast lives here once.
  useEffect(() => {
    const deleted = state.lastDeleted
    if (!deleted) return
    const id = toast({
      duration: 6000,
      position: 'bottom',
      // The toast is gone (timed out, or retired by a newer delete), and Undo with it: delete the task's
      // attachment files. After an Undo the task is back on the board, so none of them are orphans.
      // ponytail: quitting while the toast is up (or in the 2 s after) leaves the files in images/ for good.
      // Sweep images/ against the board at launch if the folder ever grows.
      onCloseComplete: () => deleteFilesAfterSave(orphanedFiles(deleted.task, tasks.current)),
      render: ({ onClose }) => createElement(Flex, {
        align: 'center', gap: 3, px: 4, py: 2, bg: c.surface, color: c.text,
        border: `1px solid ${c.borderStrong}`, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        fontFamily: 'body', fontSize: '0.85rem',
      },
        createElement(Text, { flex: 1, noOfLines: 1 }, `Deleted "${deleted.task.title}"`),
        createElement(Button, {
          size: 'sm', variant: 'secondary',
          onClick: () => { dispatch({ type: 'RESTORE_TASK', id: deleted.task.id }); onClose() },
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
    const onControl = e.target instanceof Element && !!e.target.closest('button, a')
    const key = boardKey(e, { busy: busy.current, onControl })
    if (key === null) return

    const columns = getVisibleColumns(state)
    // Call after a flushSync. Scrolls the highlighted card into view and gives it native focus too, so Space
    // (keyboard drag, which acts on the natively focused card) picks up the card the user sees highlighted.
    // Only one copy of a task is highlighted (state.focusedCol), so this is the right one in tag view as well.
    const reveal = () => {
      const card = document.querySelector<HTMLElement>('.task-card.focused')
      card?.scrollIntoView({ block: 'nearest' })
      card?.focus({ preventScroll: true })
    }

    const navKey = NAV_KEYS[key]
    if (navKey) {
      e.preventDefault()
      const next = nextFocus(columns, state.focusedTaskId, navKey, state.focusedCol)
      if (!next) return
      // The board now has the keyboard: drop native focus from a button the user clicked earlier
      // (a header button, Undo), or the next Enter would press that instead of opening the card.
      if (onControl) (e.target as HTMLElement).blur()
      flushSync(() => dispatch({ type: 'SET_FOCUSED_TASK', id: next.id, col: next.col })) // render before measuring
      reveal()
      return
    }

    if (key === 'Escape') {
      dispatch({ type: 'SET_FOCUSED_TASK', id: null })
      document.querySelector<HTMLElement>('.task-card:focus')?.blur()
      return
    }

    // Everything below acts on the focused card, and only if it is actually on screen
    // (never delete or move a card the active filters are hiding).
    const col = focusedColumn(state, columns)
    const task = col === -1 ? undefined : state.tasks.find(t => t.id === state.focusedTaskId)
    if (!task) return

    const moveTo = (status: Task['status']) => {
      if (task.status === status) return
      flushSync(() => dispatch({ type: 'MOVE_TASK', id: task.id, status }))
      reveal() // in status view the card is now in another column: a new element
    }

    if (key === 'Enter') {
      e.preventDefault()
      dispatch({ type: 'SET_EDITING_TASK', id: task.id })
    } else if (key === 'd') {
      e.preventDefault()
      moveTo(task.status === 'done' ? 'todo' : 'done')
    } else if (STATUS_KEYS[key]) {
      e.preventDefault()
      moveTo(STATUS_KEYS[key])
    } else if (key === 'x') {
      e.preventDefault()
      const row = columns[col].indexOf(task.id)
      const neighbour = columns[col][row + 1] ?? columns[col][row - 1] ?? null
      flushSync(() => {
        dispatch({ type: 'DELETE_TASK', id: task.id })
        dispatch({ type: 'SET_FOCUSED_TASK', id: neighbour, col })
      })
      reveal()
    }
  }, [state, dispatch])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
