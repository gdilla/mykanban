import { AppState, AppAction, Task } from './types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
}

export const initialState: AppState = {
  tasks: [],
  tags: [],
  editingTaskId: null,
  activeFilters: { tags: [], age: null },
  currentView: (localStorage.getItem('kanban-view') as 'status' | 'tags') || 'status',
  focusedTaskId: null,
  lastDeleted: null,
  activeTimerTaskId: null,
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, tasks: action.tasks, tags: action.tags }

    case 'ADD_TASK': {
      return { ...state, tasks: [...state.tasks, action.task] }
    }

    case 'UPDATE_TASK': {
      const tasks = state.tasks.map(t =>
        t.id === action.id ? { ...t, ...action.updates } : t
      )
      return { ...state, tasks }
    }

    case 'DELETE_TASK': {
      const index = state.tasks.findIndex(t => t.id === action.id)
      if (index === -1) return state
      const tasks = state.tasks.filter(t => t.id !== action.id)
      return { ...state, tasks, lastDeleted: { task: state.tasks[index], index } }
    }

    case 'RESTORE_TASK': {
      const { lastDeleted } = state
      // The id guards against a stale Undo (an older toast still on its way out).
      if (!lastDeleted || lastDeleted.task.id !== action.id) return state
      // Already back (an external reload can return it): just forget it.
      if (state.tasks.some(t => t.id === action.id)) return { ...state, lastDeleted: null }
      // A tag deleted since then must not come back as a dangling id (the card would vanish from tag view).
      const task = { ...lastDeleted.task, tags: lastDeleted.task.tags.filter(id => state.tags.some(t => t.id === id)) }
      const tasks = [...state.tasks]
      tasks.splice(lastDeleted.index, 0, task) // splice clamps an index past the end
      return { ...state, tasks, lastDeleted: null }
    }

    case 'MOVE_TASK': {
      const now = new Date().toISOString()
      const tasks = state.tasks.map(t => {
        if (t.id !== action.id) return t
        const updates: Partial<Task> = { status: action.status }
        if (action.status === 'doing' && t.status !== 'doing') {
          updates.startedAt = now
        }
        if (action.status === 'done' && t.status !== 'done') {
          updates.completedAt = now
          if (t.startedAt) {
            updates.timeSpent = (t.timeSpent || 0) + (Date.now() - new Date(t.startedAt).getTime())
          }
        }
        if (action.status === 'todo') {
          updates.startedAt = null
          updates.completedAt = null
        }
        // Assign sortOrder at end of target column
        const maxSort = state.tasks
          .filter(x => x.status === action.status)
          .reduce((max, x) => Math.max(max, x.sortOrder || 0), -1)
        updates.sortOrder = maxSort + 1
        return { ...t, ...updates }
      })
      // Stop timer if task moves away from doing
      let activeTimerTaskId = state.activeTimerTaskId
      if (action.id === activeTimerTaskId && action.status !== 'doing') {
        activeTimerTaskId = null
      }
      return { ...state, tasks, activeTimerTaskId }
    }

    case 'REORDER_TASKS': {
      const tasks = state.tasks.map(t => {
        const idx = action.orderedIds.indexOf(t.id)
        if (idx === -1) return t
        if (action.view === 'status') {
          return { ...t, sortOrder: idx }
        } else {
          return {
            ...t,
            tagSortOrders: { ...t.tagSortOrders, [action.columnId]: idx },
          }
        }
      })
      return { ...state, tasks }
    }

    case 'ADD_TAG':
      return { ...state, tags: [...state.tags, action.tag] }

    case 'UPDATE_TAG': {
      const tags = state.tags.map(t =>
        t.id === action.id ? { ...t, ...action.updates } : t
      )
      return { ...state, tags }
    }

    case 'DELETE_TAG': {
      const tags = state.tags.filter(t => t.id !== action.id)
      const tasks = state.tasks.map(t => ({
        ...t,
        tags: t.tags.filter(tagId => tagId !== action.id),
      }))
      return { ...state, tags, tasks }
    }

    case 'SET_EDITING_TASK':
      return { ...state, editingTaskId: action.id }

    case 'SET_VIEW':
      localStorage.setItem('kanban-view', action.view)
      return { ...state, currentView: action.view }

    case 'SET_FILTERS':
      return { ...state, activeFilters: { ...state.activeFilters, ...action.filters } }

    case 'SET_FOCUSED_TASK':
      return { ...state, focusedTaskId: action.id }

    case 'TOGGLE_TIMER': {
      const task = state.tasks.find(t => t.id === action.id)
      if (!task || task.status !== 'doing') return state

      if (state.activeTimerTaskId === action.id) {
        // Stop timer — accumulate time
        const elapsed = task.startedAt
          ? Date.now() - new Date(task.startedAt).getTime()
          : 0
        const tasks = state.tasks.map(t =>
          t.id === action.id
            ? { ...t, timeSpent: (t.timeSpent || 0) + elapsed, startedAt: new Date().toISOString() }
            : t
        )
        return { ...state, tasks, activeTimerTaskId: null }
      } else {
        // Start timer — reset startedAt
        const tasks = state.tasks.map(t =>
          t.id === action.id ? { ...t, startedAt: new Date().toISOString() } : t
        )
        return { ...state, tasks, activeTimerTaskId: action.id }
      }
    }

    case 'DUPLICATE_TASK': {
      const src = state.tasks.find(t => t.id === action.id)
      if (!src) return state
      const newTask: Task = {
        ...src,
        id: generateId(),
        title: `${src.title} (copy)`,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        timeSpent: 0,
        sortOrder: src.sortOrder + 0.5,
        status: 'todo',
      }
      return { ...state, tasks: [...state.tasks, newTask] }
    }

    default:
      return state
  }
}
