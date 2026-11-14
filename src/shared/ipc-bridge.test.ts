import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { makeBridge, INVOKE_CHANNELS, EVENT_CHANNELS } from './ipc-bridge.mjs'

function fakeIpcRenderer() {
  const ipc = new EventEmitter() as EventEmitter & { invoke: ReturnType<typeof vi.fn> }
  ipc.invoke = vi.fn(async (channel: string, ...args: unknown[]) => ({ channel, args }))
  return ipc
}

describe('makeBridge', () => {
  it('lists exactly the channels main.js handles and sends', () => {
    const main = readFileSync(new URL('../main.js', import.meta.url), 'utf8')
    const found = (re: RegExp) => [...new Set([...main.matchAll(re)].map(m => m[1]))].sort()
    expect([...INVOKE_CHANNELS].sort()).toEqual(found(/ipcMain\.handle\('([^']+)'/g))
    expect([...EVENT_CHANNELS].sort()).toEqual(found(/webContents\.send\('([^']+)'/g))
    expect(INVOKE_CHANNELS).toHaveLength(11)
    expect(EVENT_CHANNELS).toHaveLength(2)
  })

  it.each(INVOKE_CHANNELS)('invokes the allowed channel %s with its arguments', async channel => {
    const ipc = fakeIpcRenderer()
    await expect(makeBridge(ipc).invoke(channel, 'a', { b: 1 })).resolves.toEqual({ channel, args: ['a', { b: 1 }] })
    expect(ipc.invoke).toHaveBeenCalledWith(channel, 'a', { b: 1 })
  })

  it.each(['not-a-channel', 'data-changed-external', '', undefined, 'load-data '])('rejects invoke on %s without calling main', async channel => {
    const ipc = fakeIpcRenderer()
    await expect(makeBridge(ipc).invoke(channel as string)).rejects.toThrow(/not an allowed channel/)
    expect(ipc.invoke).not.toHaveBeenCalled()
  })

  it('passes event arguments to the listener but never the raw event', () => {
    const ipc = fakeIpcRenderer()
    const listener = vi.fn()
    makeBridge(ipc).on('quick-add-task', listener)
    const rawEvent = { sender: ipc, senderFrame: {} }
    ipc.emit('quick-add-task', rawEvent, 'x', 2)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('x', 2)
  })

  it('unsubscribes', () => {
    const ipc = fakeIpcRenderer()
    const listener = vi.fn()
    const off = makeBridge(ipc).on('data-changed-external', listener)
    off()
    ipc.emit('data-changed-external', {})
    expect(listener).not.toHaveBeenCalled()
    expect(ipc.listenerCount('data-changed-external')).toBe(0)
  })

  it.each(['not-a-channel', 'load-data', ''])('refuses to listen on %s', channel => {
    const ipc = fakeIpcRenderer()
    expect(() => makeBridge(ipc).on(channel, () => {})).toThrow(/not an allowed channel/)
    expect(ipc.eventNames()).toEqual([])
  })
})
