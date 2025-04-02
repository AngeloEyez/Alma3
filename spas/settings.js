import Store from 'electron-store';
import { getAppPath } from './utils.js';

// default settings
const storeConfig = {
    name: 'almaconfig',
    // 設定檔案儲存在指定目錄
    cwd: getAppPath(),
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
