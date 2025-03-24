import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron';
import path from 'path';
import os from 'os';

// [Alma]
import sc from '../spas/spas-main.js';

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

// 保存 DevTools 視窗實例
let devToolsWindow = null;

// 創建 DevTools 視窗的函數
function createDevToolsWindow(mainWindow) {
    if (devToolsWindow) {
        devToolsWindow.focus();
        return;
    }

    devToolsWindow = new BrowserWindow({
        width: 500,
        height: 800,
        title: 'DevTools',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // 設置主視窗的 DevTools 到新視窗
    mainWindow.webContents.setDevToolsWebContents(devToolsWindow.webContents);
    mainWindow.webContents.openDevTools({ mode: 'detach' });

    // 當 DevTools 視窗關閉時，清除引用
    devToolsWindow.on('closed', () => {
        devToolsWindow = null;
    });
}

try {
    if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
        require('fs').unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'));
    }
} catch (_) {}

let mainWindow;
// 保存 DevTools 狀態
let isDevToolsOpen = false;

function createWindow() {
    // 判斷是否為開發模式
    const isDev = process.env.DEBUGGING || process.env.NODE_ENV === 'development';

    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
        icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
        width: 1020, // 根據 devModeView 設置視窗寬度
        height: 520,
        minWidth: 1020, // 設定最小寬度為 1000px
        minHeight: 520,
        frame: false, // [Alma] frameless window
        useContentSize: true,
        webPreferences: {
            contextIsolation: true,
            // More info: https://v2.quasar.dev/quasar-cli-webpack/developing-electron-apps/electron-preload-script
            preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
        }
    });

    mainWindow.loadURL(process.env.APP_URL);

    // 根據 devModeView 狀態決定是否開啟 DevTools
    if (sc.devModeView) {
        createDevToolsWindow(mainWindow);
        isDevToolsOpen = true;
    } else if (!isDev) {
        // 在 production 模式下禁用 DevTools
        mainWindow.webContents.on('devtools-opened', () => {
            mainWindow.webContents.closeDevTools();
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // [Alma] Start SpasConnector
    mainWindow.webContents.on('did-finish-load', () => {
        sc.setWebContents(mainWindow.webContents);
        sc.send('init'); // start from initialize spasManager.
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// [Alma] Print config file path
console.log(`Default userData path: ${app.getPath('userData')}`);

// 採用非同步方式引入設定，避免循環依賴
setTimeout(() => {
    try {
        const { Settings } = require('../spas/settings.js');
        console.log(`Actual config file path: ${Settings.path}`);
    } catch (e) {
        console.error('Error getting Settings path:', e);
    }
}, 1000);

// 添加 DevTools 切換功能
ipcMain.on('toggle-dev-tools', () => {
    if (mainWindow) {
        if (isDevToolsOpen) {
            mainWindow.webContents.closeDevTools();
            if (devToolsWindow) {
                devToolsWindow.close();
            }
        } else {
            createDevToolsWindow(mainWindow);
        }
    }
});

// 獲取 DevTools 狀態
ipcMain.handle('is-dev-tools-open', () => {
    return isDevToolsOpen;
});

// [Alma] frameless window
ipcMain.on('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    win.minimize();
});

ipcMain.on('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    //win.setFullScreen(!win.isFullScreen());
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

ipcMain.on('window-close', () => {
    const win = BrowserWindow.getFocusedWindow();
    win.close();
});
