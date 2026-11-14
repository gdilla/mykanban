import { describe, it, expect } from 'vitest'
import { appReducer, initialState } from './reducer'

describe('appReducer', () => {
  it('SET_DATA loads tasks and tags', () => {
    const next = appReducer(initialState, { type: 'SET_DATA', tasks: [], tags: [{ id: 't1', name: 'x', color: '#fff' }] } as any)
    expect(next.tags).toHaveLength(1)
    expect(next.tasks).toEqual([])
  })
})
