import { describe, it, expect } from 'vitest'
import dates from './dates.js'

const { localDateStr, completedOn, isOverdue, summaryFileName, summaryTime } = dates

// Built from local components so these hold in any timezone.
// 21:00 local on 2 Apr: in US timezones UTC is already 3 Apr.
const ninePm = new Date(2026, 3, 2, 21, 0, 0)

describe('localDateStr', () => {
  it('is the local calendar date at 21:00, whatever the UTC date is', () => {
    expect(localDateStr(ninePm)).toBe('2026-04-02')
  })
  it('is the local calendar date just after midnight', () => {
    expect(localDateStr(new Date(2026, 3, 2, 0, 5, 0))).toBe('2026-04-02')
  })
  it('zero-pads month and day', () => {
    expect(localDateStr(new Date(2026, 0, 5, 12))).toBe('2026-01-05')
  })
})

describe('summaryFileName / summaryTime', () => {
  it('names the 9pm summary for the local date', () => {
    expect(summaryFileName(ninePm)).toBe('summary-2026-04-02.md')
  })
  it('summary time is 21:00 local on the same day', () => {
    expect(summaryTime(new Date(2026, 3, 2, 8, 30)).getTime()).toBe(ninePm.getTime())
    expect(new Date(2026, 3, 2, 20, 59) >= summaryTime(ninePm)).toBe(false)
    expect(new Date(2026, 3, 2, 23, 10) >= summaryTime(ninePm)).toBe(true)
  })
})

describe('completedOn', () => {
  const doneAt = (...local) => ({ status: 'done', completedAt: new Date(...local).toISOString() })

  it('counts a task completed at 2pm local', () => {
    expect(completedOn(doneAt(2026, 3, 2, 14, 0), '2026-04-02')).toBe(true)
  })
  it('counts a task completed at 8:59pm local (UTC date may already be tomorrow)', () => {
    expect(completedOn(doneAt(2026, 3, 2, 20, 59), '2026-04-02')).toBe(true)
  })
  it('counts a task completed just after local midnight', () => {
    expect(completedOn(doneAt(2026, 3, 2, 0, 10), '2026-04-02')).toBe(true)
  })
  it('does not count a task completed late the previous evening', () => {
    expect(completedOn(doneAt(2026, 3, 1, 23, 30), '2026-04-02')).toBe(false)
  })
  it('does not count tasks that are not done or have no completedAt', () => {
    expect(completedOn({ status: 'todo', completedAt: new Date(2026, 3, 2, 14).toISOString() }, '2026-04-02')).toBe(false)
    expect(completedOn({ status: 'done', completedAt: null }, '2026-04-02')).toBe(false)
    expect(completedOn({ status: 'done' }, '2026-04-02')).toBe(false)
  })
})

describe('isOverdue', () => {
  it('a task due today is NOT overdue', () => {
    expect(isOverdue({ status: 'todo', dueDate: '2026-04-02' }, '2026-04-02')).toBe(false)
  })
  it('a task due yesterday is overdue', () => {
    expect(isOverdue({ status: 'doing', dueDate: '2026-04-01' }, '2026-04-02')).toBe(true)
  })
  it('a task due tomorrow is not overdue', () => {
    expect(isOverdue({ status: 'todo', dueDate: '2026-04-03' }, '2026-04-02')).toBe(false)
  })
  it('done tasks and tasks without a due date are never overdue', () => {
    expect(isOverdue({ status: 'done', dueDate: '2026-04-01' }, '2026-04-02')).toBe(false)
    expect(isOverdue({ status: 'todo', dueDate: null }, '2026-04-02')).toBe(false)
    expect(isOverdue({ status: 'todo', dueDate: '' }, '2026-04-02')).toBe(false)
    expect(isOverdue({ status: 'todo' }, '2026-04-02')).toBe(false)
  })
})
