import path from 'path';

// ========================================================================================
/**
 * 對Date的擴充套件，將 Date 轉化為指定格式的String
 * 例子：
 * (new Date()).format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 * @param {string} fmt 月(M)、日(d)、小時(h)、分(m)、秒(s)、季度(q) 可以用 1-2 個佔位符，年(y)可以用 1-4 個佔位符，毫秒(S)只能用 1 個佔位符(是 1-3 位的數字)
 * @return {string}
 */
Date.prototype.Format = function (fmt) {
    var o = {
        'M+': this.getMonth() + 1, //月份
        'd+': this.getDate(), //日
        'h+': this.getHours(), //小時
        'm+': this.getMinutes(), //分
        's+': this.getSeconds(), //秒
        'q+': Math.floor((this.getMonth() + 3) / 3), //季度
        S: this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    for (var k in o) if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
    return fmt;
};

// ========================================================================================
/**
 * 讓 toISOString 配合目前時區
 * @returns {string}
 */
Date.prototype.toISOString = function () {
    let pad = n => (n < 10 ? '0' + n : n);
    let hours_offset = this.getTimezoneOffset() / 60;
    let offset_date = this.setHours(this.getHours() - hours_offset);
    let symbol = hours_offset >= 0 ? '-' : '+';
    let time_zone = symbol + pad(Math.abs(hours_offset)) + ':00';

    return this.getUTCFullYear() + '-' + pad(this.getUTCMonth() + 1) + '-' + pad(this.getUTCDate()) + 'T' + pad(this.getUTCHours()) + ':' + pad(this.getUTCMinutes()) + ':' + pad(this.getUTCSeconds()) + '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + time_zone;
};

// ========================================================================================
/**
 * 傳回 Date的 時間字串 ex: "07:00"
 * @returns {string} 時間字串 ex時間字串 ex:"07:00"
 */
Date.prototype.myGetTime = function () {
    let hours = String(this.getHours()).padStart(2, '0');
    let minutes = String(this.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

//========================================================================================
/**
 * 將 "07:00" 字串轉為今日 Date() object.
 * @param {String} timeString 時間字串如:"07:00"
 * @param {minute_delta} int default 0
 * @returns {Date} 日期物件
 */
export function timeToDate(timeString, minute_delta = 0) {
    let d = new Date();
    let t = timeString.split(':');
    d.setHours(t[0], t[1], 0, 0);
    d.setMinutes(d.getMinutes() + minute_delta);
    return d;
}

//========================================================================================
/**
 * 將 "07:00" 字串轉加上 m 分鐘.
 * @param {String} timeString 時間字串如:"07:00"
 * @param {int} m 分鐘數如 -1如 -1
 * @returns {String} 時間字串如:"06:59"
 */
export function addMinutes(timeString, m) {
    let d = new Date();
    let t = timeString.split(':');
    d.setHours(t[0], t[1], 0, 0);
    let ds = d.getTime();
    d.setTime(ds + 1000 * 60 * m);
    return d.myGetTime();
}

// ========================================================================================
/**
 * 計算工作日數
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {int} 工作日數
 */
export function calculateBusinessDays(startDate, endDate) {
    // Validate input
    if (endDate < startDate) return 0;

    // Calculate days between dates
    var millisecondsPerDay = 86400 * 1000; // Day in milliseconds
    startDate.setHours(0, 0, 0, 1); // Start just after midnight
    endDate.setHours(23, 59, 59, 999); // End just before midnight
    var diff = endDate - startDate; // Milliseconds between datetime objects
    var days = Math.ceil(diff / millisecondsPerDay);

    // Subtract two weekend days for every week in between
    var weeks = Math.floor(days / 7);
    days = days - weeks * 2;

    // Handle special cases
    var startDay = startDate.getDay();
    var endDay = endDate.getDay();

    // Remove weekend not previously removed.
    if (startDay - endDay > 1) days = days - 2;

    // Remove start day if span starts on Sunday but ends before Saturday
    if (startDay == 0 && endDay != 6) {
        days = days - 1;
    }

    // Remove end day if span ends on Saturday but starts after Sunday
    if (endDay == 6 && startDay != 0) {
        days = days - 1;
    }

    return days;
}

// ========================================================================================
/**
 * 轉成百分比
 * @param {number} percent 數值
 * @returns {string} 百分比表示
 */
export const toPercent = percent => `${(percent * 100).toFixed(2)}%`;

// ========================================================================================
/**
 * 產生min到max之間的亂數
 * @param {int} min
 * @param {int} max
 * @returns
 */
export function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ========================================================================================
// Sleep & Delay
// ========================================================================================
function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

/**
 * Delay for random milliseconds.
 * @param {int} min 最小值 default 700
 * @param {int} max 最大值 default 2500
 */
export async function delay(min = 0, max = 0) {
    let t = 0;
    if (min != 0 && max == 0) {
        t = min;
    } else {
        if (min == 0 && max == 0) {
            min = 700;
            max = 2500;
        }
        t = getRandom(min, max);
    }
    await sleep(t);
}

/**
 * 使用更簡單的方法獲取可能的儲存路徑 (check docs/filepath.md)
 * @returns {string} 儲存路徑
 */
export function getAppPath() {
    try {
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
            return path.join(__dirname, '../../tmp');
        } else {
            // 針對portable打包後的可執行文件環境
            if (process.env.PORTABLE_EXECUTABLE_DIR) {
                return process.env.PORTABLE_EXECUTABLE_DIR;
            }

            // 其他模式（包括 7z、nsis、dir 等）
            return path.dirname(process.execPath);

            // 使用相對路徑，這將使配置文件存放在應用程序目錄下
            //return '.';
        }
    } catch (e) {
        console.error('Error getting storage path:', e);
        return '.';
    }
}
