const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize store
const store = new Store();

let mainWindow;
let tray = null;
let screenshotInterval = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  mainWindow.loadFile('src/index.html');

  // Create tray icon
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => mainWindow.show()
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Screenshot Capture');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => mainWindow.show());

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('start-capture', (event, { interval, format, folderPath }) => {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }

  store.set('settings', { interval, format, folderPath });

  const screenshot = require('screenshot-desktop');
  const fs = require('fs');
  const moment = require('moment');

  screenshotInterval = setInterval(async () => {
    try {
      const img = await screenshot({ format });
      const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
      const filename = `screenshot_${timestamp}.${format}`;
      const fullPath = path.join(folderPath, filename);

      fs.writeFile(fullPath, img, (err) => {
        if (err) {
          console.error('Error saving screenshot:', err);
          if (mainWindow) {
            mainWindow.webContents.send('capture-error', err.message);
          }
        } else {
          console.log('Screenshot saved:', fullPath);
          if (mainWindow) {
            mainWindow.webContents.send('capture-success', fullPath);
          }
          if (Notification.isSupported()) {
            new Notification({
              title: 'Screenshot Captured',
              body: `Saved to ${filename}`,
              icon: path.join(__dirname, '../assets/icon.png')
            }).show();
          }
        }
      });
    } catch (err) {
      console.error('Error capturing screenshot:', err);
      if (mainWindow) {
        mainWindow.webContents.send('capture-error', err.message);
      }
    }
  }, interval * 1000);

  return { success: true };
});

ipcMain.handle('stop-capture', () => {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
  return { success: true };
});

ipcMain.handle('get-settings', () => {
  return store.get('settings') || {
    interval: 5,
    format: 'png',
    folderPath: require('os').homedir() + '/Documents'
  };
});