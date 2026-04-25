const { app, BrowserWindow, dialog } = require('electron')
const { spawn, execSync, spawnSync } = require('child_process')
const path = require('path')
const net = require('net')
const fs = require('fs')

let serverProcess, mainWindow, loadingWindow

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

function findNode() {
  try {
    const r = execSync('where node', { encoding: 'utf8', shell: true }).trim()
    const first = r.split('\n')[0].trim()
    if (first && fs.existsSync(first)) return first
  } catch (e) {}

  const candidates = [
    'C:\\Program Files\\nodejs\\node.exe',
    'C:\\Program Files (x86)\\nodejs\\node.exe',
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return 'node'
}

function findNpm() {
  try {
    const r = execSync('where npm', { encoding: 'utf8', shell: true }).trim()
    const lines = r.split('\n').map(l => l.trim()).filter(Boolean)
    const cmd = lines.find(l => l.toLowerCase().endsWith('.cmd')) || lines[0]
    if (cmd && fs.existsSync(cmd)) return cmd
  } catch (e) {}

  // Derive npm.cmd from node location
  try {
    const nodeBin = path.dirname(findNode())
    const npmCmd = path.join(nodeBin, 'npm.cmd')
    if (fs.existsSync(npmCmd)) return npmCmd
  } catch (e) {}

  const candidates = [
    'C:\\Program Files\\nodejs\\npm.cmd',
    'C:\\Program Files (x86)\\nodejs\\npm.cmd',
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return 'npm'
}

// server lives in resources/server/ outside the asar
function getServerDir() {
  const inResources = path.join(process.resourcesPath, 'server')
  const inDev = path.join(__dirname, '..', 'server')
  if (fs.existsSync(path.join(inResources, 'src', 'server.js'))) return inResources
  if (fs.existsSync(path.join(inDev, 'src', 'server.js'))) return inDev
  return null
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer()
    s.once('error', () => resolve(false))
    s.once('listening', () => { s.close(); resolve(true) })
    s.listen(port, '127.0.0.1')
  })
}

function waitForPort(port, retries = 30, delay = 500) {
  return new Promise((resolve, reject) => {
    let n = 0
    const check = () => {
      const sock = new net.Socket()
      sock.setTimeout(500)
      sock.once('connect', () => { sock.destroy(); resolve() })
      sock.once('error',   () => { sock.destroy(); ++n >= retries ? reject() : setTimeout(check, delay) })
      sock.once('timeout', () => { sock.destroy(); ++n >= retries ? reject() : setTimeout(check, delay) })
      sock.connect(port, '127.0.0.1')
    }
    check()
  })
}

function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 420, height: 280, frame: false,
    resizable: false, center: true, alwaysOnTop: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  })
  loadingWindow.loadURL('data:text/html,<html><body style="margin:0;background:%231a1a2e;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:%23fff;"><div style="font-size:22px;font-weight:bold;margin-bottom:8px">Kanpur Laboratory</div><div style="font-size:13px;color:%23aaa;margin-bottom:24px">Starting services...</div><div id="s" style="font-size:12px;color:%237eb8f7;margin-bottom:20px;text-align:center;padding:0 20px">Initialising...</div><div style="width:260px;height:4px;background:%23333;border-radius:2px;overflow:hidden"><div id="b" style="height:100%;width:5%;background:%234a9eff;border-radius:2px;transition:width 0.4s ease"></div></div></body></html>')
}

function setStatus(text, pct) {
  if (!loadingWindow || loadingWindow.isDestroyed()) return
  loadingWindow.webContents.executeJavaScript(
    `document.getElementById('s').textContent=${JSON.stringify(text)};` +
    `document.getElementById('b').style.width='${pct}%'`
  ).catch(() => {})
}

// install server deps if node_modules missing — only happens on first launch
function ensureServerDeps(serverDir, npmPath) {
  const nmDir = path.join(serverDir, 'node_modules')
  if (fs.existsSync(nmDir)) return true

  setStatus('Installing server dependencies (first launch only)...', 30)

  // Wrap paths in quotes to handle spaces (e.g. C:\Program Files\nodejs\npm.cmd)
  const quotedNpm = `"${npmPath}"`
  const quotedDir = `"${serverDir}"`

  const result = spawnSync(quotedNpm, ['install', '--prefix', quotedDir], {
    encoding: 'utf8',
    timeout: 120000,
    shell: true,      // needed for .cmd files on Windows
    env: { ...process.env }
  })

  const errText = [
    result.stderr || '',
    result.stdout || '',
    result.error ? result.error.message : ''
  ].filter(Boolean).join('\n').trim()

  if (result.status !== 0 || result.error) {
    dialog.showErrorBox('Setup failed',
      'Could not install server dependencies.\n\n' +
      'npm path: ' + npmPath + '\n' +
      'server dir: ' + serverDir + '\n\n' +
      (errText.slice(0, 800) || 'No output captured. Ensure Node.js is installed and added to PATH.')
    )
    return false
  }
  return true
}

async function startServer() {
  setStatus('Checking port 5000...', 10)
  if (!(await isPortFree(5000))) {
    setStatus('Server already running', 70)
    return true
  }

  setStatus('Locating server files...', 20)
  const serverDir = getServerDir()
  if (!serverDir) {
    dialog.showErrorBox('Files not found',
      'Cannot locate server files.\n\n' +
      'resourcesPath: ' + process.resourcesPath
    )
    return false
  }

  const nodePath = findNode()
  const npmPath  = findNpm()

  // install deps on first launch
  const depsOk = ensureServerDeps(serverDir, npmPath)
  if (!depsOk) return false

  setStatus('Starting Express server...', 60)
  const serverScript = path.join(serverDir, 'src', 'server.js')

  serverProcess = spawn(nodePath, [serverScript], {
    env: {
      ...process.env,
      PORT: '5000',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/kanpur_lab',
      AUTH_SECRET: 'kanpur-lab-secret-key',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'admin123'
    },
    stdio: 'pipe'
  })

  let errOut = ''
  serverProcess.stdout.on('data', d => console.log('[svr]', d.toString().trim()))
  serverProcess.stderr.on('data', d => { errOut += d; console.error('[svr]', d.toString().trim()) })
  serverProcess.on('exit', code => console.log('[svr] exit', code))

  setStatus('Waiting for server to be ready...', 75)
  try {
    await waitForPort(5000)
    return true
  } catch {
    dialog.showErrorBox('Server failed to start',
      'node: ' + nodePath + '\n' +
      'script: ' + serverScript + '\n\n' +
      (errOut.slice(0, 500) || 'No error output.\nIs MongoDB running?\nRun: net start MongoDB')
    )
    return false
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, show: false,
    icon: path.join(__dirname, '../build/KanpurLab_AppLogo192.png'),
    webPreferences: { nodeIntegration: false }
  })
  mainWindow.loadFile(path.join(__dirname, '../build/index.html'))
  mainWindow.setTitle('Kanpur Laboratory')
  mainWindow.setMenuBarVisibility(false)
  mainWindow.once('ready-to-show', () => {
    if (loadingWindow && !loadingWindow.isDestroyed()) { loadingWindow.close(); loadingWindow = null }
    mainWindow.show()
    mainWindow.focus()
  })
  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  if (!gotLock) return
  createLoadingWindow()
  setStatus('Starting up...', 5)
  const ok = await startServer()
  if (!ok) { app.quit(); return }
  setStatus('Loading app...', 90)
  createWindow()
})

app.on('window-all-closed', () => { if (serverProcess) { serverProcess.kill(); serverProcess = null } app.quit() })
app.on('before-quit',       () => { if (serverProcess) { serverProcess.kill(); serverProcess = null } })