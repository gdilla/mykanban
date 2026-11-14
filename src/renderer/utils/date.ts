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

// Time spent on a task, from milliseconds.
export function formatTime(ms: number): string {
  if (!ms || ms < 60000) return '< 1m'
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}
