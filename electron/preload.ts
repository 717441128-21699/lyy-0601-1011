import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filters: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke('dialog:openFile', filters),
  saveFile: (filters: { name: string; extensions: string[] }[], defaultPath?: string) =>
    ipcRenderer.invoke('dialog:saveFile', filters, defaultPath),
});
