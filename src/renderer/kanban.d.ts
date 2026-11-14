// `window.kanban` is the page's only way to reach the main process (src/preload.js).
import type { KanbanBridge } from '../shared/ipc-bridge.mjs'

declare global {
  interface Window { kanban: KanbanBridge }
}

export {}
