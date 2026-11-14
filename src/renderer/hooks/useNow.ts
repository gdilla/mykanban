import { useSyncExternalStore } from 'react'

// One clock for every running timer on the board: a single interval, running only while something reads it
// and the window is visible. Showing the window again catches up at once. A tick re-renders only the
// components that call useNow (the running-time badges), not the cards around them.
const TICK_MS = 30_000
const listeners = new Set<() => void>()
let now = Date.now()
let timer: ReturnType<typeof setInterval> | undefined

function tick() {
  now = Date.now()
  listeners.forEach(listener => listener())
}

function startOrStop() {
  const run = listeners.size > 0 && document.visibilityState !== 'hidden'
  if (run && !timer) {
    tick()
    timer = setInterval(tick, TICK_MS)
  } else if (!run && timer) {
    clearInterval(timer)
    timer = undefined
  }
}

document.addEventListener('visibilitychange', startOrStop)

export function subscribeNow(listener: () => void) {
  listeners.add(listener)
  startOrStop()
  return () => {
    listeners.delete(listener)
    startOrStop()
  }
}

export const getNow = () => now

/** The current time in ms, updated every 30 s while the window is visible. */
export default function useNow(): number {
  return useSyncExternalStore(subscribeNow, getNow)
}
