import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

// Tests run in plain Node: a stand-in for the page's visibility.
const page = Object.assign(new EventTarget(), { visibilityState: 'visible' })
const setVisibility = (state: 'visible' | 'hidden') => {
  page.visibilityState = state
  page.dispatchEvent(new Event('visibilitychange'))
}

let clock: typeof import('./useNow')
beforeAll(async () => {
  vi.useFakeTimers({ now: Date.parse('2026-11-14T12:00:00Z') })
  vi.stubGlobal('document', page)
  clock = await import('./useNow')
})
afterAll(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the shared clock', () => {
  it('runs one interval for every subscriber, only while someone is subscribed and the window is visible', () => {
    const a = vi.fn(), b = vi.fn()
    expect(vi.getTimerCount()).toBe(0)
    const offA = clock.subscribeNow(a)
    const offB = clock.subscribeNow(b)
    expect(vi.getTimerCount()).toBe(1)
    expect(clock.getNow()).toBe(Date.now())

    a.mockClear(); b.mockClear()
    vi.advanceTimersByTime(60_000)
    expect(a).toHaveBeenCalled()
    expect(b).toHaveBeenCalled()
    expect(clock.getNow()).toBe(Date.now())

    // Hidden: no ticks at all
    setVisibility('hidden')
    expect(vi.getTimerCount()).toBe(0)
    a.mockClear()
    vi.advanceTimersByTime(10 * 60_000)
    expect(a).not.toHaveBeenCalled()

    // Shown again: catches up at once, then keeps ticking
    setVisibility('visible')
    expect(a).toHaveBeenCalledTimes(1)
    expect(clock.getNow()).toBe(Date.now())
    expect(vi.getTimerCount()).toBe(1)

    offA(); offB()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('a first subscriber after a quiet spell reads the current time, not the last tick', () => {
    vi.advanceTimersByTime(2 * 3_600_000)
    const off = clock.subscribeNow(() => {})
    expect(clock.getNow()).toBe(Date.now())
    off()
  })
})
