import { app, BrowserWindow, shell, ipcMain, session, dialog } from 'electron'
import { release } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Options, download, Progress } from 'electron-dl'
import Store from 'electron-store'

globalThis.__filename = fileURLToPath(import.meta.url)
globalThis.__dirname = dirname(__filename)

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.mjs')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')



// 创建一个新的Store实例
const store = new Store()

async function handleSelectedDownloadDir() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '选择保存路径',
    properties: ['openDirectory', 'createDirectory']
  })
  if (!canceled) {
    store.set('download-save-dir', filePaths[0])
    return filePaths[0]
  }
}

ipcMain.on('bilibili-download', async (event, info) => {
  let directory = store.get('download-save-dir');
  while (!directory) {
    directory = await handleSelectedDownloadDir()
  }
  const opt: Options = {
    directory: directory as string,
    filename: info.properties.filename,
  }

  const allWindows = BrowserWindow.getAllWindows();
  const win = allWindows.length > 0 ? allWindows[0] : null; // 获取第一个窗口
  download(win, info.url, opt)
    .then(dl => {
      const allWindows = BrowserWindow.getAllWindows();
      const win = allWindows.length > 0 ? allWindows[0] : null; // 获取第一个窗口
      if (win) {
        win.webContents.send('bilibili-download-complete', dl.getSavePath(), info.url);
      }
    })
})

ipcMain.handle('getStoreValue', (event, key) => {
  return store.get(key)
})

ipcMain.handle('setStoreValue', (event, key, value) => {
  return store.set(key, value)
})
ipcMain.handle('dialog:openDir', (event, key, value) => {
  handleSelectedDownloadDir()
})

async function createWindow() {
  const filter = { urls: ['*://*/*'] }; // 替换为需要关闭CORS的URL

  session.defaultSession.webRequest.onBeforeSendHeaders(filter, async (details, callback) => {
    const urlObj = new URL(details.url)

    details.requestHeaders['Origin'] = urlObj.origin;

    details.requestHeaders['Referer'] = urlObj.origin;
    details.requestHeaders['Cookie'] = await store.get('bilibili-cookie') as string
    callback({ requestHeaders: details.requestHeaders });
  });

  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    details.responseHeaders['Access-Control-Allow-Origin'] = ['*']; // 替换为允许的域名
    callback({ responseHeaders: details.responseHeaders });
  });

  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
      // 禁用webSecurity
      webSecurity: false
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  //win.webContents.on('will-navigate', (event, url) => { }) #344


  //mainwin.js
  win.webContents.session.on('will-download', (evt, item, webContents) => {
    let value: number = 0

    item.on('updated', (evt, state) => {
      process.stdout.write('download:' + state + "\n")
      if (state === 'progressing') {
        // 计算进度百分比
        if (item.getReceivedBytes() && item.getTotalBytes()) {
          value = Math.round(item.getReceivedBytes() / item.getTotalBytes() * 100)
        }

        // 发送百分比给渲染进程进行展示
        webContents.send('bilibili-download-progress', value, item.getURL());
      }
    });
  });

  // 监听 will-download
  //session.defaultSession.on('will-download', (event, item, webContents) => { })



}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})
