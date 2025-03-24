import { ipcRenderer, contextBridge } from 'electron';

const SPAS_API = {
    do: async (action, data = {}) => {
        var ipcMsg = JSON.stringify({
            action: action,
            data: data
        });
        const replyMessage = await ipcRenderer.invoke('spas/do', ipcMsg);
        //console.log('SPASAPI.do', 'replymessage:' + replyMessage);
        return replyMessage;
    },
    receive: (channel, listener) => {
        let validChannels = ['toRenderer'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, message) => listener(event, message));
        }
    },
    get: async key => {
        return await ipcRenderer.invoke('spas/get', key);
    },
    getAllSettings: async () => {
        return await ipcRenderer.invoke('spas/getAll');
    },
    set: (key, value) => {
        var ipcMsg = JSON.stringify({
            key: key,
            value: value
        });
        return ipcRenderer.invoke('spas/set', ipcMsg);
    }
};

const ALMA_API = {
    minimize: () => {
        ipcRenderer.send('window-minimize');
    },

    maximize: () => {
        ipcRenderer.send('window-maximize');
    },

    close: () => {
        ipcRenderer.send('window-close');
    },

    // 添加 DevTools 切換功能
    toggleDevTools: () => {
        ipcRenderer.send('toggle-dev-tools');
    },

    // 獲取當前開發模式狀態
    isDevToolsOpen: async () => {
        return await ipcRenderer.invoke('is-dev-tools-open');
    }
};

// window.SPAS
contextBridge.exposeInMainWorld('SPAS', SPAS_API);

// [Alma] frameless window
contextBridge.exposeInMainWorld('ALMA', ALMA_API);
