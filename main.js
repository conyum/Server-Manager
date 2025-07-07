const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const crypto = require('crypto');
const prompt = require('electron-prompt');
const store = new Store({ name: 'servers' });
let activeSSH = null;
let activeIndex = null;

function deriveKey(pass, salt) {
  return crypto.pbkdf2Sync(pass, salt, 100_000, 32, 'sha256');
}

function encryptServers(servers, pass) {
  const salt = crypto.randomBytes(16);
  const key  = deriveKey(pass, salt);
  const iv   = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encList = servers.map(s => ({
    ...s,
    password: cipher.update(s.password, 'utf8', 'hex') + cipher.final('hex')
  }));

  return {
    salt: salt.toString('hex'),
    iv:    iv.toString('hex'),
    servers: encList
  };
}

function decryptServers(envelope, pass) {
  const salt = Buffer.from(envelope.salt, 'hex');
  const iv   = Buffer.from(envelope.iv, 'hex');
  const key  = deriveKey(pass, salt);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

  return envelope.servers.map(s => ({
    ...s,
    password: decipher.update(s.password, 'hex', 'utf8') + decipher.final('utf8')
  }));
}

function createWindow() {
    const { Menu } = require('electron');
    Menu.setApplicationMenu(null);
    const win = new BrowserWindow({
    width: 1400,
    height: 800,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true 
    }
  });
  win.removeMenu();
  win.loadFile('index.html').then(() => {
    //win.webContents.openDevTools({ mode: 'detach' });
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-servers', () => {
  return store.get('servers', []);
});

ipcMain.handle('add-server', async (event, server) => {
  const list = store.get('servers', []);
  list.push(server);
  store.set('servers', list);
  return { success: true };
});

ipcMain.handle('remove-server', (event, idx) => {
  const servers = store.get('servers', []);
  if (typeof idx !== 'number' || idx < 0 || idx >= servers.length) {
    return { success: false, error: 'Invalid index' };
  }
  servers.splice(idx, 1);
  store.set('servers', servers);
  return { success: true };
});

ipcMain.handle('connect-server', async (event, arg1, arg2) => {

  let server, index;
  if (arg1 && typeof arg1 === 'object' && arg1.server !== undefined && arg1.index !== undefined) {
    ({ server, index } = arg1);
  } else {
    server = arg1;
    index  = arg2;
  }

  if (!server || typeof server.username !== 'string') {
    return { success: false, error: 'Invalid server object in connect-server' };
  }

  if (activeSSH) activeSSH.dispose();
  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: server.host,
      port: server.port,
      username: server.username,
      password: server.password || undefined,
      privateKey: server.privateKey || undefined,
    });
    activeSSH  = ssh;
    activeIndex = index;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('disconnect-server', () => {
  if (activeSSH) activeSSH.dispose();
  activeSSH = null;
  activeIndex = null;
  return { success: true };
});

ipcMain.handle('run-command', async (e, cmd) => {
  if (!activeSSH) return { error: 'Not connected.' };
  try {
    const res = await activeSSH.execCommand(cmd);
    return { stdout: res.stdout, stderr: res.stderr };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('export-servers', async (event, servers) => {
  
  const pass = await prompt({
    title: 'Encrypt Server List',
    label: 'Enter a passphrase:',
    inputAttrs: { type: 'password' },
    type: 'input'
  });
  if (pass === null) return { success: false };  

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save encrypted servers…',
    defaultPath: 'servers.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (canceled || !filePath) return { success: false };

  try {
    const envelope = encryptServers(servers, pass);
    fs.writeFileSync(filePath, JSON.stringify(envelope, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('import-servers', async (event) => {
  const pass = await prompt({
    title: 'Decrypt Server List',
    label: 'Enter your passphrase:',
    inputAttrs: { type: 'password' },
    type: 'input'
  });
  if (pass === null) return { success: false };

  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Open encrypted servers…',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (canceled || !filePaths.length) return { success: false };

  try {
    const envelope = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'));
    const decrypted = decryptServers(envelope, pass);
    store.set('servers', decrypted);
    return { success: true, servers: decrypted };
  } catch (err) {
    return { success: false, error: err.message };
  }
});