import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron';
import path from 'path';
import os from 'os';

// [Alma]
import sc from '../spas/spas-main.js';

// 嘗試disable gpu嘗試disable gpu
// app.commandLine.appendSwitch('disable-gpu');
// console.log(`disable-gpu: ${process.env.DISABLE_GPU}`);
// console.log(`disable-gpu: ${app.commandLine.hasSwitch('disable-gpu')}`);
// console.log(`no-sandbox: ${app.commandLine.hasSwitch('no-sandbox')}`);

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

let mainWindow;
// 保存 DevTools 視窗實例
let devToolsWindow = null;
// 保存 DevTools 狀態
let isDevToolsOpen = false;

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
        minWidth: 900, // 設定最小寬度為 1000px
        minHeight: 320,
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

    // 根據 settings裡面儲存的視窗大小調整
    const savedSize = sc.settings.get('windowSize');
    if (savedSize) {
        mainWindow.setSize(savedSize.width, savedSize.height);
    }

    mainWindow.on('resize', () => {
        if (!mainWindow.isMaximized()) {
            const size = mainWindow.getSize();
            sc.settings.set('windowSize', {
                width: size[0],
                height: size[1]
            });
        }
    });

    mainWindow.on('closed', () => {
        if (devToolsWindow) {
            devToolsWindow.close();
            devToolsWindow = null;
        }
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
//console.log(`Default userData path: ${app.getPath('userData')}`);

// 採用非同步方式引入設定，避免循環依賴
setTimeout(() => {
    try {
        const { Settings } = require('../spas/settings.js');
        console.log(`Config file path: ${Settings.path}`);
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
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    if (mainWindow) {
        // 關閉主視窗時，會觸發 closed 事件，在那裡會處理 DevTools 視窗的關閉
        mainWindow.close();
    }
});

// 檢查視窗是否最大化
ipcMain.handle('window-is-maximized', () => {
    if (mainWindow) {
        return mainWindow.isMaximized();
    }
    return false;
});
