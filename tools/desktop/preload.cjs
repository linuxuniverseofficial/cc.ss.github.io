const { contextBridge } = require('electron');

if (location.protocol === 'coastal:' && location.hostname === 'game') {
  contextBridge.exposeInMainWorld('CoastalDesktop', { exitGame: () => window.close() });
}
