export interface Attachment {
  filename: string
  originalName: string
  type: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'doing' | 'done'
  dueDate: string // YYYY-MM-DD
  tags: string[]
  attachments: Attachment[]
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  timeSpent: number
  sortOrder: number
  tagSortOrders: Record<string, number>
}

export interface AppState {
  tasks: Task[]
  tags: Tag[]
  editingTaskId: string | null
  activeFilters: {
    tags: string[]
    age: string | null
  }
  currentView: 'status' | 'tags'
  focusedTaskId: string | null
  // Column (index on screen) the focused card is in: tag view can draw one task in several columns.
  // -1 = not known, the first column showing it.
  focusedCol: number
  loaded: boolean // false until the first SET_DATA
  showAllDone: boolean // Done column expanded past the most recent few
  lastDeleted: { task: Task; index: number } | null // one level of undo
  activeTimerTaskId: string | null
}

export type AppAction =
  | { type: 'SET_DATA'; tasks: Task[]; tags: Tag[] }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; id: string; updates: Partial<Task> }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'RESTORE_TASK'; id: string }
  | { type: 'FORGET_DELETED'; id: string }
  | { type: 'MOVE_TASK'; id: string; status: Task['status'] }
  | { type: 'REORDER_TASKS'; columnId: string; orderedIds: string[]; view: 'status' | 'tags' }
  | { type: 'ADD_TAG'; tag: Tag }
  | { type: 'UPDATE_TAG'; id: string; updates: Partial<Tag> }
  | { type: 'DELETE_TAG'; id: string }
  | { type: 'SET_EDITING_TASK'; id: string | null }
  | { type: 'SET_VIEW'; view: 'status' | 'tags' }
  | { type: 'SET_FILTERS'; filters: Partial<AppState['activeFilters']> }
  | { type: 'SET_FOCUSED_TASK'; id: string | null; col?: number }
  | { type: 'SET_SHOW_ALL_DONE'; show: boolean }
  | { type: 'TOGGLE_TIMER'; id: string }
  | { type: 'DUPLICATE_TASK'; id: string }
