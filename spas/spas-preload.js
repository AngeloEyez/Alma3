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
    },
    // 與 SpasManager.devModeView 相關的方法
    toggleDevModeView: () => {
        return ipcRenderer.invoke('spas/toggleDevModeView');
    },
    setDevModeView: value => {
        return ipcRenderer.invoke('spas/setDevModeView', value);
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

    // 保留 DevTools 切換功能，因為這仍然可能在其他地方被單獨使用
    toggleDevTools: () => {
        ipcRenderer.send('toggle-dev-tools');
    }
};

// window.SPAS
contextBridge.exposeInMainWorld('SPAS', SPAS_API);

// [Alma] frameless window
contextBridge.exposeInMainWorld('ALMA', ALMA_API);
