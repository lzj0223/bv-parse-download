const { app, BrowserWindow, ipcMain } = require('electron');
const { download } = require('electron-dl');
const path = require('path');
async function createWindow() {
    const mainWindow = new BrowserWindow();
    mainWindow.loadURL('https://example.com');
    mainWindow.webContents.on('did-finish-load', async () => {
        const files = [
            { url: 'https://example.com/file1.ext', directory: 'path/to/save/file1' },
            { url: 'https://example.com/file2.ext', directory: 'path/to/save/file2' },
            // Add more files with their respective URLs and directories
        ];
        for (const file of files) {
            const options = {
                directory: path.join(app.getPath('downloads'), file.directory),
            };
            try {
                const dl = await download(mainWindow, file.url, options);
                console.log(`File saved to: ${dl.getSavePath()}`);
            } catch (error) {
                console.error('File download failed:', error);
            }
        }
        mainWindow.close();
    });
}
app.on('ready', createWindow);