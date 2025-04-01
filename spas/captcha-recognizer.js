// captcha-recognizer.js
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
const { join, dirname } = require('path');
import { app } from 'electron';

// const fs = require('fs').promises;
// const logFile = join('.', 'error.log');

// 使用 Tesseract.js v6 API 識別驗證碼
export async function recognizeCaptcha(captchaBase64) {
    try {
        // 將 base64 圖像轉換為 buffer 並進行預處理
        const buffer = Buffer.from(captchaBase64, 'base64');
        const processedBuffer = await sharp(buffer).resize(200, 80).greyscale().normalize().toFormat('png').toBuffer();

        const isDev = process.env.NODE_ENV === 'development';
        const langPath = isDev ? join(__dirname, '../../node_modules/@tesseract.js-data/eng/4.0.0') : join(app.getAppPath(), '../tesseract-data');
        //await fs.appendFile(logFile, `langPath:${langPath}` + '\n\n');

        // 建立 worker 實例（每次識別創建新的 worker，避免狀態問題）
        const worker = await createWorker('eng', 1, {
            langPath: langPath,
            load_system_dawg: '0', // 禁用字典，提高非標準文字識別率
            load_freq_dawg: '0' // 禁用頻率字典
        });

        // 設置最佳參數用於驗證碼識別
        // PSM 7: 將圖像視為單行文字
        // 僅允許有效的驗證碼字符
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            tessedit_pageseg_mode: '7',
            tessjs_create_hocr: '0',
            tessjs_create_tsv: '0',
            preserve_interword_spaces: '0'
        });

        // 執行識別
        const { data } = await worker.recognize(processedBuffer);

        // 終止 worker 釋放資源
        await worker.terminate();

        // 清理結果中的空格和特殊字符
        return data.text.trim().replace(/[\n\r\s]+/g, '');
    } catch (error) {
        console.error('CAPTCHA ERROR:', error);
        //await fs.appendFile(logFile, `CAPTCHA ERROR: ${error.message}\n堆棧: ${error.stack}` + '\n\n');
        throw error;
        return '';
    }
}
