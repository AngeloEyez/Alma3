import { ipcMain } from 'electron';
import { SpasConnector } from './SpasConnector';

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

export default sc;
