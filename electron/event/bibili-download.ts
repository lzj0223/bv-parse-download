import { ipcRenderer } from "electron";

export default {
    onBilibiliDownloadProgress: (callback) => ipcRenderer.on('bilibili-download-progress', (_event, value) => callback(value)),
    onBilibiliDownloadComplete: (callback) => ipcRenderer.on('bilibili-download-complete', (_event, value) => callback(value))
}