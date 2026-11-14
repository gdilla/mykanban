// The only way the renderer reaches the main process: src/preload.js exposes makeBridge(ipcRenderer)
// as `window.kanban`. A channel main handles or sends must be listed here, or the renderer cannot use it.

// Renderer -> main, `ipcMain.handle` in src/main.js
export const INVOKE_CHANNELS = [
  'load-data', 'save-data', 'get-paths', 'generate-summary', 'list-summaries', 'read-summary',
  'save-image', 'load-image', 'delete-image', 'open-attachment', 'save-file',
]

// Main -> renderer, `webContents.send` in src/main.js
export const EVENT_CHANNELS = ['data-changed-external', 'quick-add-task']

const refuse = channel => new Error(`${String(channel)} is not an allowed channel`)

export function makeBridge(ipcRenderer) {
  return {
    invoke(channel, ...args) {
      if (!INVOKE_CHANNELS.includes(channel)) return Promise.reject(refuse(channel))
      return ipcRenderer.invoke(channel, ...args)
    },
    // Returns the unsubscribe function. The listener gets the message's arguments, never the IPC event.
    on(channel, listener) {
      if (!EVENT_CHANNELS.includes(channel)) throw refuse(channel)
      const wrapped = (_event, ...args) => listener(...args)
      ipcRenderer.on(channel, wrapped)
      return () => { ipcRenderer.removeListener(channel, wrapped) }
    },
  }
}
