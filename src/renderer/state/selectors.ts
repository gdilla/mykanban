import { AppState, Task } from './types'

export const DONE_LIMIT = 10

export function getFilteredTasks(state: AppState): Task[] {
  let filtered = state.tasks

  // Filter by tags
  if (state.activeFilters.tags.length > 0) {
    filtered = filtered.filter(t =>
      state.activeFilters.tags.some(tagId => t.tags.includes(tagId))
    )
  }

  // Filter by age
  if (state.activeFilters.age) {
    const now = Date.now()
    const ms: Record<string, number> = {
      '1d': 86400000,
      '3d': 259200000,
      '1w': 604800000,
      '2w': 1209600000,
      '1m': 2592000000,
    }
    const cutoff = ms[state.activeFilters.age]
    if (cutoff) {
      filtered = filtered.filter(t => {
        const age = now - new Date(t.createdAt).getTime()
        return age <= cutoff
      })
    }
  }

  return filtered
}

export function getTasksByStatus(state: AppState, status: Task['status']): Task[] {
  return getFilteredTasks(state)
    .filter(t => t.status === status)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
}

export function getTasksByTag(state: AppState, tagId: string): Task[] {
  return getFilteredTasks(state)
    .filter(t => t.tags.includes(tagId))
    .sort((a, b) => (a.tagSortOrders?.[tagId] || 0) - (b.tagSortOrders?.[tagId] || 0))
}

export function getUntaggedTasks(state: AppState): Task[] {
  return getFilteredTasks(state)
    .filter(t => !t.tags || t.tags.length === 0)
    // Its own order once reordered in tag view (tagSortOrders.__untagged__); until then the order it always had.
    .sort((a, b) => (a.tagSortOrders?.__untagged__ ?? a.sortOrder ?? 0) - (b.tagSortOrders?.__untagged__ ?? b.sortOrder ?? 0))
}

// The Done column in status view: a log, most recently completed first, cut to the latest DONE_LIMIT
// until the user asks for all of it. ISO timestamps compare as strings; no timestamp sorts last.
export function getDoneTasks(state: AppState): Task[] {
  const done = getTasksByStatus(state, 'done')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  return state.showAllDone ? done : done.slice(0, DONE_LIMIT)
}

// The board as it is drawn: the cards of each column, left to right, top to bottom.
// The views, keyboard navigation and drag all read this, so they agree on what is on screen.
// One snapshot is kept per (tasks, tags, filters, view, Done expanded): every reader gets the same arrays
// (so memoised columns stay put) and the same answer, even though an age filter depends on the clock.
// ponytail: so an age filter is re-applied when the data or filters change, not the minute a card ages out.
let snapshot: { key: unknown[]; columns: Task[][] } | undefined
export function getBoardColumns(state: AppState): Task[][] {
  const key = [state.tasks, state.tags, state.activeFilters, state.currentView, state.showAllDone]
  if (!snapshot || key.some((k, i) => k !== snapshot!.key[i])) {
    const columns = state.currentView === 'status'
      ? [getTasksByStatus(state, 'todo'), getTasksByStatus(state, 'doing'), getDoneTasks(state)]
      : [...state.tags.map(tag => getTasksByTag(state, tag.id)), getUntaggedTasks(state)]
    snapshot = { key, columns }
  }
  return snapshot.columns
}
