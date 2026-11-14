// Runs sandboxed, so it can load nothing but `electron`; electron-vite bundles ipc-bridge.mjs in.
import { contextBridge, ipcRenderer } from 'electron'
import { makeBridge } from './shared/ipc-bridge.mjs'

contextBridge.exposeInMainWorld('kanban', makeBridge(ipcRenderer))
