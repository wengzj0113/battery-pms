const path = require('path')
const http = require('http')
const crypto = require('crypto')
const { app, BrowserWindow, dialog } = require('electron')

const isPackaged = app.isPackaged
const port = Number(process.env.DESKTOP_PORT || 3001)
const host = '127.0.0.1'

const getProjectRoot = () => {
  if (isPackaged) return app.getAppPath()
  return path.resolve(__dirname, '..')
}

const waitForServer = (retries = 60) => new Promise((resolve, reject) => {
  const attempt = (remaining) => {
    const req = http.get(`http://${host}:${port}/api/health`, (res) => {
      res.resume()
      if (res.statusCode === 200) {
        resolve()
        return
      }
      if (remaining <= 0) {
        reject(new Error(`服务启动失败，状态码 ${res.statusCode}`))
        return
      }
      setTimeout(() => attempt(remaining - 1), 500)
    })
    req.on('error', () => {
      if (remaining <= 0) {
        reject(new Error('服务启动超时'))
        return
      }
      setTimeout(() => attempt(remaining - 1), 500)
    })
    req.end()
  }
  attempt(retries)
})

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 760,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.once('ready-to-show', () => {
    win.show()
  })

  win.loadURL(`http://${host}:${port}`)
}

const bootstrapServer = () => {
  const root = getProjectRoot()
  const userData = app.getPath('userData')
  process.env.NODE_ENV = 'production'
  process.env.HOST = host
  process.env.PORT = String(port)
  process.env.FRONTEND_DIST = path.join(root, 'frontend', 'dist')
  process.env.DATA_FILE = path.join(userData, 'data.json')
  process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.createHash('sha256').update(userData).digest('hex')
  process.env.SEED_DEFAULT_USERS = process.env.SEED_DEFAULT_USERS || 'true'
  require(path.join(root, 'backend', 'server.js'))
}

app.whenReady().then(async () => {
  try {
    bootstrapServer()
    await waitForServer()
    createWindow()
  } catch (error) {
    dialog.showErrorBox('启动失败', error.message)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
