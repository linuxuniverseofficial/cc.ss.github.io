const { app, BrowserWindow, net, protocol } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const home = 'coastal://game/index.html';
const root = path.join(__dirname, 'game');
protocol.registerSchemesAsPrivileged([{
  scheme: 'coastal',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
}]);

app.whenReady().then(async () => {
  protocol.handle('coastal', request => {
    const url = new URL(request.url);
    const relative = decodeURIComponent(url.pathname).slice(1);
    const file = path.resolve(root, relative);
    if (url.host !== 'game' || !file.startsWith(root + path.sep)) {
      return new Response(null, { status: 404 });
    }
    return net.fetch(pathToFileURL(file).href, { headers: request.headers });
  });
  const window = new BrowserWindow({
    title: 'Coastal Chaos: Sunset Shores',
    fullscreen: true,
    backgroundColor: '#100e1c',
    icon: path.join(root, 'appicons/icon-512.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false }
  });
  window.removeMenu();
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, target) => {
    if (!target.startsWith('coastal://game/')) event.preventDefault();
  });
  await window.loadURL(home);
});
app.on('window-all-closed', () => app.quit());
