import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { AppState, AppAction } from './types'
import { appReducer, initialState } from './reducer'

const { ipcRenderer } = window.require('electron')

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const loadedRef = useRef(false)

  // Load data on mount
  useEffect(() => {
    async function load() {
      const data = await ipcRenderer.invoke('load-data')
      if (data) {
        // Migrate legacy formats
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
        const tags = data.tags || []
        dispatch({ type: 'SET_DATA', tasks, tags })
        loadedRef.current = true
      }
    }
    load()
  }, [])

  // Auto-save on state change (debounced)
  useEffect(() => {
    if (!loadedRef.current) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      ipcRenderer.invoke('save-data', {
        tasks: state.tasks,
        tags: state.tags,
      })
    }, 300)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [state.tasks, state.tags])

  // Listen for quick-add-task from main process
  useEffect(() => {
    const handler = () => dispatch({ type: 'SET_EDITING_TASK', id: '__quick_add__' })
    ipcRenderer.on('quick-add-task', handler)
    return () => { ipcRenderer.removeListener('quick-add-task', handler) }
  }, [])

  // Reload data when changed externally (e.g. MCP server)
  useEffect(() => {
    const handler = async () => {
      const data = await ipcRenderer.invoke('load-data')
      if (data) {
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
        const tags = data.tags || []
        dispatch({ type: 'SET_DATA', tasks, tags })
      }
    }
    ipcRenderer.on('data-changed-external', handler)
    return () => { ipcRenderer.removeListener('data-changed-external', handler) }
  }, [])

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
