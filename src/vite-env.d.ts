/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ElectronAPI {
  openDir: () => {},
  store: StoreAPI
}

interface StoreAPI {
  get: (key: string) => Promise<any>,
  set: (key: string, value: string) => Promise<any>
}

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
  electronAPI: ElectronAPI,
}
