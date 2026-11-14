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

/** Delete attachment files from disk. A failure is logged and the file stays, an orphan. */
export const deleteFiles = (filenames: string[]) => filenames.forEach(f =>
  ipcRenderer.invoke('delete-image', f).catch((e: Error) => console.error(`Could not delete attachment file ${f}:`, e)))

/**
 * Delete files that a change just made in the app took off the board. Main refuses to delete a file
 * the saved board still lists, and the save that drops these is debounced, so ask once it has had
 * time to reach disk.
 */
// ponytail: fixed 2 s wait; if the save has not landed (or was refused) the file stays on disk,
// an orphan rather than a broken attachment. Upgrade: delete from the save path once it reports success.
export const deleteFilesAfterSave = (filenames: string[]) => {
  if (filenames.length) setTimeout(() => deleteFiles(filenames), 2000)
}
