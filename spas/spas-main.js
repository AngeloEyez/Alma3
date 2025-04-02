import { app, BrowserWindow, ipcMain } from 'electron';
import { SpasConnector } from './SpasConnector';
import { getAppPath } from './utils.js';
import path from 'path';

// ==================================================================================
// Electron-Log Setup  (https://github.com/megahertz/electron-log)
//
import log from 'electron-log/main';
log.initialize(); // Optional, initialize the logger for any renderer process

log.transports.file.resolvePathFn = () => path.join(getAppPath(), 'logs/main.log'); // log file path
//log.transports.file.level = false;  // log file disabled

Object.assign(console, log.functions); // Overriding console

// ==================================================================================
// Spas Connector
//
const sc = new SpasConnector();

ipcMain.handle('spas/do', async (event, message) => {
    console.log(`[spas-main]receive message from render: ${message}`);
    const result = await sc.do(message);
    //console.log(`[spas-main]return message : ${result}`);
    return result;
});

ipcMain.handle('spas/get', async (event, message) => {
    return await sc.settings.get(message);
});

ipcMain.handle('spas/getAll', (event, message) => {
    return sc.settings.store;
});

ipcMain.handle('spas/set', async (event, message) => {
    let msg = JSON.parse(message);
    sc.settings.set(msg.key, msg.value);
    return true;
});

// 處理 devModeView 的操作
ipcMain.handle('spas/toggleDevModeView', event => {
    const result = sc.toggleDevModeView();
    // 移除 DevTools 相關的同步操作，因為已經改用獨立視窗
    return result;
});

ipcMain.handle('spas/setDevModeView', (event, value) => {
    const result = sc.setDevModeView(value);
    // 移除 DevTools 相關的同步操作，因為已經改用獨立視窗
    return result;
});

// // 處理視窗大小相關事件
// ipcMain.handle('window-get-size', async event => {
//     const win = BrowserWindow.getFocusedWindow();
//     if (win) {
//         const size = win.getSize();
//         return { width: size[0], height: size[1] };
//     }
//     return null;
// });

// ipcMain.on('window-set-size', (event, width, height) => {
//     const win = BrowserWindow.getFocusedWindow();
//     if (win) {
//         win.setSize(width, height);
//     }
// });

// 監聽視窗大小變化
function setupWindowSizeListener() {
    BrowserWindow.getAllWindows().forEach(win => {
        // 排除 dev tool 窗口
        if (!win.webContents.isDevToolsOpened()) {
            win.on('resize', () => {
                if (!win.isMaximized()) {
                    const size = win.getSize();
                    console.log('window size changed:', size);
                    sc.settings.set('windowSize', {
                        width: size[0],
                        height: size[1]
                    });
                }
            });
        }
    });
}

// 在應用程式啟動時設置視窗大小
app.on('ready', () => {
    // ... existing code ...

    // 設置視窗大小監聽器
    setupWindowSizeListener();
    // 如果有保存的視窗大小，則使用它
    const savedSize = sc.settings.get('windowSize');
    if (savedSize) {
        const win = BrowserWindow.getFocusedWindow();
        if (win && !win.webContents.isDevToolsOpened()) {
            win.setSize(savedSize.width, savedSize.height);
        }
    }
});

export default sc;
