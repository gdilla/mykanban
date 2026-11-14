import type { Task } from '../state/types'

export type DueTone = 'overdue' | 'soon' | 'normal'

// Label and tone for a YYYY-MM-DD due date, read as a LOCAL calendar date.
export function dueLabel(dueDate: string, today: Date): { label: string; tone: DueTone } {
  const [y, m, d] = dueDate.split('-').map(Number)
  const due = new Date(y, m - 1, d)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // round, not ceil/floor: local midnights are 23h or 25h apart across a DST change
  const days = Math.round((due.getTime() - start.getTime()) / 86400000)
  if (Number.isNaN(days)) return { label: dueDate, tone: 'normal' }
  if (days < 0) return { label: `${-days}d overdue`, tone: 'overdue' }
  if (days === 0) return { label: 'today', tone: 'soon' }
  if (days === 1) return { label: 'tomorrow', tone: 'soon' }
  if (days <= 3) return { label: `in ${days}d`, tone: 'soon' }
  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase(),
    tone: 'normal',
  }
}

// Time spent on a task as of `now` (ms): what is recorded, plus, while it is in progress, the time since it
// was started. Done tasks keep their startedAt, so only `doing` counts. A start in the future (clock skew) adds nothing.
export function timeSpentAt(task: Pick<Task, 'status' | 'startedAt' | 'timeSpent'>, now: number): number {
  const recorded = task.timeSpent || 0
  const started = task.status === 'doing' && task.startedAt ? Date.parse(task.startedAt) : NaN
  return Number.isNaN(started) ? recorded : recorded + Math.max(0, now - started)
}

// Time spent on a task, from milliseconds.
export function formatTime(ms: number): string {
  if (!ms || ms < 60000) return '< 1m'
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}
