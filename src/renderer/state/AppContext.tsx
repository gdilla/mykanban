import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react'
import { Box, useToast } from '@chakra-ui/react'
import { AppState, AppAction, Task, Tag } from './types'
import { appReducer, initialState } from './reducer'

const { ipcRenderer } = window.require('electron')

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

// Bring whatever is on disk (including legacy shapes) up to the current task shape
function migrate(data: any): { tasks: Task[]; tags: Tag[] } {
  const tasks = (data.tasks || []).map((t: any) => ({
    ...t,
    title: t.title ?? t.content ?? '',
    description: t.description ?? '',
    tags: t.tags ?? [],
    attachments: t.attachments ?? (t.images ? t.images.map((f: string) => ({
      filename: f, originalName: f, type: 'image/png'
    })) : []),
    tagSortOrders: t.tagSortOrders ?? {},
    timeSpent: t.timeSpent ?? 0,
    sortOrder: t.sortOrder ?? 0,
  }))
  return { tasks, tags: data.tags || [] }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [loadError, setLoadError] = useState<string | null>(null)
  const toast = useToast()
  const stateRef = useRef(state)
  stateRef.current = state
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined) // set while a save is pending
  const loadedRef = useRef(false) // false until a load succeeds: never save over a file we could not read
  const fromDiskRef = useRef(false) // the next tasks/tags change came from disk: do not write it back

  const cancelPendingSave = useCallback(() => {
    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = undefined
  }, [])

  // Load from disk: on mount, when the file changes externally, and when a save is refused as stale
  const reload = useCallback(async () => {
    // ponytail: a UI change not yet saved when the file changes underneath is dropped, disk wins.
    // Merge per task if that ever bites.
    cancelPendingSave()
    const data = await ipcRenderer.invoke('load-data')
    if (data.error) {
      loadedRef.current = false
      setLoadError(data.error)
      return
    }
    setLoadError(null)
    loadedRef.current = true
    fromDiskRef.current = true
    dispatch({ type: 'SET_DATA', ...migrate(data) })
  }, [cancelPendingSave])

  const save = useCallback(async () => {
    saveTimeoutRef.current = undefined
    try {
      const { tasks, tags } = stateRef.current
      const written = await ipcRenderer.invoke('save-data', { tasks, tags })
      if (!written) reload() // refused: the file changed underneath us
    } catch (e) {
      if (!toast.isActive('save-failed')) {
        toast({ id: 'save-failed', title: 'Could not save', description: String(e), status: 'error', duration: null, isClosable: true })
      }
    }
  }, [reload, toast])

  useEffect(() => {
    reload()
    ipcRenderer.on('data-changed-external', reload)
    return () => { ipcRenderer.removeListener('data-changed-external', reload) }
  }, [reload])

  // Auto-save on state change (debounced)
  useEffect(() => {
    if (fromDiskRef.current) { fromDiskRef.current = false; return }
    if (!loadedRef.current) return
    saveTimeoutRef.current = setTimeout(save, 300)
    return cancelPendingSave
    // Only data changes schedule a save; `save` reads the latest state through stateRef.
  }, [state.tasks, state.tags])

  // Do not lose the last 300 ms of edits on quit or window reload
  useEffect(() => {
    const flush = () => {
      if (!saveTimeoutRef.current) return
      cancelPendingSave()
      save()
    }
    window.addEventListener('beforeunload', flush)
    return () => window.removeEventListener('beforeunload', flush)
  }, [save, cancelPendingSave])

  // Listen for quick-add-task from main process
  useEffect(() => {
    const handler = () => dispatch({ type: 'SET_EDITING_TASK', id: '__quick_add__' })
    ipcRenderer.on('quick-add-task', handler)
    // In-app Cmd+N: same path as the global hotkey
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && e.key === 'n') { e.preventDefault(); handler() }
    }
    window.addEventListener('keydown', onKey)
    return () => { ipcRenderer.removeListener('quick-add-task', handler); window.removeEventListener('keydown', onKey) }
  }, [])

  if (loadError) {
    return <Box p={8} role="alert">Could not read {loadError}. Fix or remove the file and the board will reload.</Box>
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
