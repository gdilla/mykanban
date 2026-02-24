import { AppState, Task } from './types'

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
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
}
