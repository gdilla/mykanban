import { AppState, AppAction, Task } from './types'
import { isStatus } from './drop'
import { applyStatusChange, withTagOrders } from '../../shared/task-rules.mjs'

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
  focusedCol: -1,
  loaded: false,
  showAllDone: false,
  lastDeleted: null,
  activeTimerTaskId: null,
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DATA':
      // Repair statuses the old tag-view drop bug wrote (a tag id in `status`), so the task is back on the board.
      return {
        ...state,
        tasks: action.tasks.map(t => (isStatus(t.status) ? t : { ...t, status: 'todo' })),
        tags: action.tags,
        // A filter on a tag that is gone (deleted by an agent) would hide every card, with no chip to switch it off.
        activeFilters: { ...state.activeFilters, tags: state.activeFilters.tags.filter(id => action.tags.some(t => t.id === id)) },
        loaded: true,
      }

    // Whoever sets a task's tags (quick add, the edit window, a drop in tag view), the reducer gives it
    // its place in those tag columns: the rule shared with the MCP server.
    case 'ADD_TASK': {
      return { ...state, tasks: [...state.tasks, withTagOrders(action.task, state.tasks)] }
    }

    case 'UPDATE_TASK': {
      const tasks = state.tasks.map(t => {
        if (t.id !== action.id) return t
        const updated = { ...t, ...action.updates }
        return action.updates.tags ? withTagOrders(updated, state.tasks) : updated
      })
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
      // ...nor keep its place in that tag's column. Otherwise the task goes back untouched. (The board "before"
      // includes the task as it was deleted, so the tags it still has are not new to it and keep their place.)
      const tags = lastDeleted.task.tags.filter(id => state.tags.some(t => t.id === id))
      const task = tags.length === lastDeleted.task.tags.length
        ? lastDeleted.task
        : withTagOrders({ ...lastDeleted.task, tags }, [...state.tasks, lastDeleted.task])
      const tasks = [...state.tasks]
      tasks.splice(lastDeleted.index, 0, task) // splice clamps an index past the end
      return { ...state, tasks, lastDeleted: null }
    }

    case 'MOVE_TASK': {
      if (!isStatus(action.status)) return state
      // Timestamps, timeSpent and sortOrder: the rules shared with the MCP server
      const tasks = state.tasks.map(t =>
        t.id === action.id ? applyStatusChange(t, action.status, state.tasks) : t
      )
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
      const tasks = state.tasks.map(t => t.tags.includes(action.id)
        ? withTagOrders({ ...t, tags: t.tags.filter(tagId => tagId !== action.id) }, state.tasks)
        : t)
      // Its filter chip goes with it, so the filter must too.
      const activeFilters = { ...state.activeFilters, tags: state.activeFilters.tags.filter(id => id !== action.id) }
      return { ...state, tags, tasks, activeFilters }
    }

    case 'SET_EDITING_TASK':
      return { ...state, editingTaskId: action.id }

    case 'SET_VIEW':
      localStorage.setItem('kanban-view', action.view)
      return { ...state, currentView: action.view }

    case 'SET_FILTERS':
      return { ...state, activeFilters: { ...state.activeFilters, ...action.filters } }

    case 'SET_FOCUSED_TASK':
      return { ...state, focusedTaskId: action.id, focusedCol: action.col ?? -1 }

    case 'SET_SHOW_ALL_DONE':
      return { ...state, showAllDone: action.show }

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
