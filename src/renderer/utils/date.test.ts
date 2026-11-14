import { describe, it, expect } from 'vitest'
import { dueLabel, formatTime } from './date'

// "today" is built from local components and injected, so this holds in any timezone.
// 21:00 local: in US timezones UTC is already the next day.
const today = new Date(2026, 3, 2, 21, 0, 0)
const due = (offsetDays: number) => {
  const d = new Date(2026, 3, 2 + offsetDays)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

describe('dueLabel', () => {
  it('due today reads "today" and is due-soon, not overdue', () => {
    expect(dueLabel(due(0), today)).toEqual({ label: 'today', tone: 'soon' })
  })
  it('due yesterday reads "1d overdue" with the overdue tone', () => {
    expect(dueLabel(due(-1), today)).toEqual({ label: '1d overdue', tone: 'overdue' })
  })
  it('due tomorrow reads "tomorrow"', () => {
    expect(dueLabel(due(1), today)).toEqual({ label: 'tomorrow', tone: 'soon' })
  })
  it('due in 3 days reads "in 3d" and is still due-soon', () => {
    expect(dueLabel(due(3), today)).toEqual({ label: 'in 3d', tone: 'soon' })
  })
  it('due in 7 days shows the local calendar date, normal tone', () => {
    expect(dueLabel(due(7), today)).toEqual({ label: 'apr 9', tone: 'normal' })
  })
  it('due 10 days ago reads "10d overdue"', () => {
    expect(dueLabel(due(-10), today)).toEqual({ label: '10d overdue', tone: 'overdue' })
  })
  it('is the same at one minute past midnight and one minute to midnight', () => {
    expect(dueLabel('2026-04-02', new Date(2026, 3, 2, 0, 1)).label).toBe('today')
    expect(dueLabel('2026-04-02', new Date(2026, 3, 2, 23, 59)).label).toBe('today')
  })
  it('counts calendar days across a DST change (US spring forward, 8 Mar 2026)', () => {
    expect(dueLabel('2026-03-09', new Date(2026, 2, 7, 12)).label).toBe('in 2d')
  })
  it('shows an unparseable value as-is instead of "Invalid Date"', () => {
    expect(dueLabel('soon', today)).toEqual({ label: 'soon', tone: 'normal' })
  })
})

describe('formatTime', () => {
  it('reads anything under a minute as "< 1m", never "0m"', () => {
    for (const ms of [0, -5, 1, 59_999]) expect(formatTime(ms)).toBe('< 1m')
  })

  it('shows whole minutes, then hours and minutes', () => {
    expect(formatTime(60_000)).toBe('1m')
    expect(formatTime(59 * 60_000 + 59_999)).toBe('59m')
    expect(formatTime(3_600_000)).toBe('1h 0m')
    expect(formatTime(2 * 3_600_000 + 5 * 60_000)).toBe('2h 5m')
  })
})
