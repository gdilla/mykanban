const { ipcRenderer } = window.require('electron')

export function useIpc() {
  return {
    loadData: () => ipcRenderer.invoke('load-data'),
    saveData: (data: any) => ipcRenderer.invoke('save-data', data),
    saveImage: (base64: string) => ipcRenderer.invoke('save-image', base64),
    saveFile: (data: { base64Data: string; originalName: string; mimeType: string }) =>
      ipcRenderer.invoke('save-file', data),
    loadImage: (filename: string) => ipcRenderer.invoke('load-image', filename),
    deleteImage: (filename: string) => ipcRenderer.invoke('delete-image', filename),
    /** Opens with the system default app (or shows a non-document in Finder); resolves to '' on success, else an error message. */
    openAttachment: (filename: string): Promise<string> => ipcRenderer.invoke('open-attachment', filename),
    listSummaries: () => ipcRenderer.invoke('list-summaries'),
    readSummary: (filename: string) => ipcRenderer.invoke('read-summary', filename),
    generateSummary: () => ipcRenderer.invoke('generate-summary'),
  }
}
