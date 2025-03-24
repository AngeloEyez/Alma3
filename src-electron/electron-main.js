import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron';
import path from 'path';
import os from 'os';

// [Alma]
import sc from '../spas/spas-main.js';

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

try {
    if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
        require('fs').unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'));
    }
} catch (_) {}

let mainWindow;
// 保存 DevTools 狀態
let isDevToolsOpen = false;
// DevTools 寬度（用於調整視窗大小）
const devToolsWidth = 500;

function createWindow() {
    // 判斷是否為開發模式
    const isDev = process.env.DEBUGGING || process.env.NODE_ENV === 'development';

    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
        icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
        width: isDev ? 1100 + devToolsWidth : 1100, // 開發模式下增加視窗寬度
        height: 600,
        minWidth: 1000, // 設定最小寬度為 1000px
        frame: false, // [Alma] frameless window
        useContentSize: true,
        webPreferences: {
            contextIsolation: true,
            // More info: https://v2.quasar.dev/quasar-cli-webpack/developing-electron-apps/electron-preload-script
            preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
        }
    });

    mainWindow.loadURL(process.env.APP_URL);

    // 開發模式下自動開啟 DevTools
    if (isDev) {
        mainWindow.webContents.openDevTools();
        isDevToolsOpen = true;
    } else {
        // we're on production; no access to devtools pls
        mainWindow.webContents.on('devtools-opened', () => {
            mainWindow.webContents.closeDevTools();
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 監聽 DevTools 開啟關閉事件
    mainWindow.webContents.on('devtools-opened', () => {
        isDevToolsOpen = true;
        adjustWindowSize(true);
    });

    mainWindow.webContents.on('devtools-closed', () => {
        isDevToolsOpen = false;
        adjustWindowSize(false);
    });

    // [Alma] Start SpasConnector
    mainWindow.webContents.on('did-finish-load', () => {
        sc.setWebContents(mainWindow.webContents);
        sc.send('init'); // start from initialize spasManager.
    });
}

// 根據 DevTools 狀態調整視窗大小
function adjustWindowSize(isDevToolsOpen) {
    if (!mainWindow) return;

    const [width, height] = mainWindow.getSize();
    const newWidth = isDevToolsOpen ? width + devToolsWidth : width - devToolsWidth;

    // 如果當前視窗尺寸與預期尺寸相差不大，則不調整
    if (Math.abs(newWidth - width) < 100) return;

    mainWindow.setSize(newWidth, height);
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
        } else {
            mainWindow.webContents.openDevTools();
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
