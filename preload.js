const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getServers: () => ipcRenderer.invoke('get-servers'),
  addServer: server => ipcRenderer.invoke('add-server', server),
  removeServer: idx => ipcRenderer.invoke('remove-server', idx),
  connectServer: (server, index) => ipcRenderer.invoke('connect-server', { server, index }),
  disconnectServer: () => ipcRenderer.invoke('disconnect-server'),
  runCommand: cmd => ipcRenderer.invoke('run-command', cmd),
  exportServers: servers => ipcRenderer.invoke('export-servers', servers),
  importServers:      () => ipcRenderer.invoke('import-servers')
});