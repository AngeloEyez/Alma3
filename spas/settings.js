import Store from 'electron-store';
// 避免在 renderer 進程中直接導入 app
let app;
try {
    const electron = require('electron');
    app = electron.app || (electron.remote && electron.remote.app);
} catch (e) {
    // 忽略錯誤
}

// 使用更簡單的方法獲取可能的儲存路徑
const getStoragePath = () => {
    try {
        // 針對打包後的可執行文件環境
        if (process.env.PORTABLE_EXECUTABLE_DIR) {
            return process.env.PORTABLE_EXECUTABLE_DIR;
        }

        // 使用相對路徑，這將使配置文件存放在應用程序目錄下
        return '.';
    } catch (e) {
        console.error('Error getting storage path:', e);
        return '.';
    }
};

// default settings
const storeConfig = {
    name: 'almaconfig',
    // 設定檔案儲存在指定目錄
    cwd: getStoragePath(),
    defaults: {
        signIn: {
            workId: '',
            password: 'spas'
        },
        token: '',
        workStartTime: '07:36',
        workEndTime: '17:05',
        disabledProject: [1696, 1697],
        simultaneousGroup: [],
        useSpasEndTime: false,
        windowSize: {
            width: 800,
            height: 600
        }
    }
};

export const Settings = new Store(storeConfig);
