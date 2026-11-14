// Types for ipc-bridge.mjs, so the TypeScript test can import it.
export const INVOKE_CHANNELS: readonly string[]
export const EVENT_CHANNELS: readonly string[]

export interface KanbanBridge {
  invoke(channel: string, ...args: unknown[]): Promise<any>
  /** Returns the unsubscribe function. */
  on(channel: string, listener: (...args: unknown[]) => void): () => void
}

export function makeBridge(ipcRenderer: {
  invoke(channel: string, ...args: unknown[]): Promise<any>
  on(channel: string, listener: (...args: any[]) => void): unknown
  removeListener(channel: string, listener: (...args: any[]) => void): unknown
}): KanbanBridge
