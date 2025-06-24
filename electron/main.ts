import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'


const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  // Gestione corretta del path preload per sviluppo e produzione
  let preloadPath: string;
  
  if (VITE_DEV_SERVER_URL) {
    // Modalità sviluppo - usa il file preload.mjs
    preloadPath = path.join(__dirname, 'preload.mjs');
  } else {
    // Modalità produzione - controlla quale file esiste
    const preloadMjs = path.join(__dirname, 'preload.mjs');
    const preloadJs = path.join(__dirname, 'preload.js');
    
    // Usa il file che effettivamente esiste
    if (existsSync(preloadMjs)) {
      preloadPath = preloadMjs;
    } else {
      preloadPath = preloadJs;
    }
  }
  win = new BrowserWindow({
    title: 'TradeLog - Trading Journal',
    icon: path.join(process.env.VITE_PUBLIC!, 'TradeLog.ico'),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      zoomFactor: 1.0, // Fattore di zoom iniziale
    },
  })
  // Rimuovi il menu predefinito
  win.setMenuBarVisibility(false)
  // Gestori per il controllo dello zoom
  // Zoom in con Ctrl++
  win.webContents.on('before-input-event', (_, input) => {
    if (input.control && input.key === '=') { // = è il tasto per +
      const currentZoom = win?.webContents.getZoomFactor() || 1.0
      const newZoom = Math.min(currentZoom + 0.1, 3.0) // Massimo 300%
      win?.webContents.setZoomFactor(newZoom)
    }
    // Zoom out con Ctrl+-
    else if (input.control && input.key === '-') {
      const currentZoom = win?.webContents.getZoomFactor() || 1.0
      const newZoom = Math.max(currentZoom - 0.1, 0.3) // Minimo 30%
      win?.webContents.setZoomFactor(newZoom)
    }
    // Reset zoom con Ctrl+0
    else if (input.control && input.key === '0') {
      win?.webContents.setZoomFactor(1.0)
    }
  })

  // Abilitare il zoom con Ctrl + rotellina del mouse
  win.webContents.on('zoom-changed', (_, zoomDirection) => {
    const currentZoom = win?.webContents.getZoomFactor() || 1.0
    let newZoom = currentZoom
    
    if (zoomDirection === 'in') {
      newZoom = Math.min(currentZoom + 0.1, 3.0)
    } else if (zoomDirection === 'out') {
      newZoom = Math.max(currentZoom - 0.1, 0.3)
    }
    
    win?.webContents.setZoomFactor(newZoom)
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

// IPC handlers for file system operations
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result
})

ipcMain.handle('save-file', async (_event, data: string, filePath: string) => {
  try {
    await fs.writeFile(filePath, data, 'utf8')
    return { success: true }
  } catch (error) {
    console.error('Error saving file:', error)
    throw error
  }
})

ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return data
  } catch (error) {
    console.error('Error reading file:', error)
    throw error
  }
})

// Gestori per i settings persistenti
const getSettingsPath = () => {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'tradelog-settings.json')
}

ipcMain.handle('save-settings', async (_event, settings: Record<string, unknown>) => {
  try {
    const settingsPath = getSettingsPath()
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
    return { success: true }
  } catch (error) {
    console.error('Error saving settings:', error)
    throw error
  }
})

ipcMain.handle('load-settings', async () => {
  try {
    const settingsPath = getSettingsPath()
    const data = await fs.readFile(settingsPath, 'utf8')
    
    // Controlla se il file è vuoto
    if (!data || data.trim() === '') {
      console.log('Settings file is empty, returning default settings')
      return {}
    }
    
    try {
      return JSON.parse(data)
    } catch (parseError) {
      console.error('Error parsing settings JSON:', parseError)
      console.log('Corrupted settings file, returning default settings')
      return {}
    }
  } catch (error) {
    // Se il file non esiste, ritorna settings vuoti
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('Settings file does not exist, returning default settings')
      return {}
    }
    console.error('Error loading settings:', error)
    return {}
  }
})

ipcMain.handle('reset-settings', async () => {
  try {
    const settingsPath = getSettingsPath()
    await fs.writeFile(settingsPath, JSON.stringify({}, null, 2), 'utf8')
    console.log('Settings file reset successfully')
    return { success: true }
  } catch (error) {
    console.error('Error resetting settings:', error)
    throw error
  }
})
