import Store from 'electron-store';
import path from 'path';

// 使用更簡單的方法獲取可能的儲存路徑
const getStoragePath = () => {
    try {
        // 針對portable打包後的可執行文件環境
        if (process.env.PORTABLE_EXECUTABLE_DIR) {
            return process.env.PORTABLE_EXECUTABLE_DIR;
        }

        // 其他模式（包括 7z、nsis、dir 等）
        return path.dirname(process.execPath);

        // 使用相對路徑，這將使配置文件存放在應用程序目錄下
        //return '.';
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
        workEndTime: '18:33',
        disabledProject: [],
        simultaneousGroup: [],
        useSpasEndTime: false,
        workDays: [], // 儲存工作日設定，格式為 YYYY/MM/DD 字串陣列
        windowSize: {
            width: 1000,
            height: 450
        }
    }
};

export const Settings = new Store(storeConfig);
