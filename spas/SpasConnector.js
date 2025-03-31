/* ===========================================================*/
// SpasConnector Class
// Work in main process
/* ===========================================================*/
import { axios } from '../src/boot/axios';
import { delay } from './utils.js';
import { SpasConfig } from './spasConfig.js';
import { Settings } from './settings.js';
import { BrowserWindow } from 'electron';
import { recognizeCaptcha } from './captcha-recognizer.js';

class SpasConnector {
    constructor() {
        this.settings = Settings;
        this.win = null;
        this.token = this.settings.get('token');
        this.signIn = this.settings.get('signIn');
        this.session = '';

        // 開發模式視圖控制變數，根據環境預設值
        this.devModeView = process.env.NODE_ENV !== 'production';
    }

    // 切換開發模式視圖
    toggleDevModeView() {
        this.devModeView = !this.devModeView;
        return this.devModeView;
    }

    // 設置開發模式視圖
    setDevModeView(value) {
        this.devModeView = !!value;
        return this.devModeView;
    }

    setWebContents(mw) {
        this.win = mw;
    }
    send(msg) {
        console.log('sc.send', msg);
        this.win.send('toRenderer', msg);
    }

    init() {
        let result = false;
        // 重新讀取setting資料
        this.token = this.settings.get('token');
        this.signIn = this.settings.get('signIn');

        console.log(`spasConnector initing...workId=${this.signIn.workId} | password=${this.signIn.password} | token=${this.token}`);
        if (this.signIn.workId == '' || this.token == '') {
            this.send('needSignIn');
            console.log('needSignIn');
            result = false; // need sign in
        } else {
            this.send('start');
            console.log('start SpasManager');
            result = true; // spasConnector init succesfully.
        }
        return result;
    }

    async do(message) {
        let msg = JSON.parse(message);
        let result = 'unknown result with action: ' + msg.action;

        let config = new SpasConfig(msg.action);

        switch (msg.action) {
            case 'initSpasConnector': {
                this.init();
                break;
            }
            case 'logOut': {
                console.log('SC: loging out...');
                this.settings.reset('signIn');
                this.settings.reset('token');
                this.token = this.settings.get('signIn.token');
                this.signIn = this.settings.get('signIn');
                this.session = '';

                this.init();
                break;
            }
            case 'getKaptchaImg': {
                let res, captchaImg, verifyCode;
                // 取得 captcha 影像並辨識，如果失敗就重複5次如果失敗就重複5次
                for (let i = 0; i < 5; i++) {
                    res = await axios(config);
                    captchaImg = Buffer.from(res.data, 'binary').toString('base64');
                    verifyCode = await recognizeCaptcha(captchaImg);
                    console.log('    CAPTCHA result:', verifyCode);

                    if (verifyCode.length === 4) {
                        break;
                    } else {
                        console.log('    CAPTCHA not good, retry in 3 seconds...');
                        await new Promise(resolve => setTimeout(resolve, 3000)); // 延遲3秒
                    }
                }

                result = { img: captchaImg, verifyCode: verifyCode };

                let setCookie = res.headers['set-cookie'].toString();
                let start = setCookie.indexOf('SESSION=');
                let end = setCookie.indexOf(';', start);
                this.session = setCookie.substring(start, end);
                console.log(`    ${this.session}`);
                //console.log(res.request._header);
                break;
            }
            case 'signIn': {
                config.data.workId = msg.data.workId;
                config.data.password = msg.data.password;
                config.data.verifyCode = msg.data.verifyCode;
                config.headers.Cookie = this.session;
                let res = await axios(config);
                if (res.data.code != 200) {
                    console.log('signIn ERROR: ' + res.data.msg);
                    console.log(res.request._header);
                    console.log(JSON.stringify(res.config));
                    result = { result: false, msg: `signIn Error: ${res.data.msg}` };
                } else {
                    console.log('SignIn Successful.');
                    this.token = res.data.data.token;
                    this.signIn.workId = msg.data.workId;
                    this.signIn.password = msg.data.password;
                    this.settings.set('signIn', this.signIn);
                    this.settings.set('token', this.token);
                    result = { result: true, msg: 'signIn successful.' };
                    // get detail user data
                    (async function (t) {
                        await delay(1000, 3000);
                        let c = new SpasConfig('getUsersByConditions');
                        c.data.userId = t.signIn.workId;
                        c.headers.token = t.token;
                        let res = await axios(c);
                        if (res.data.code != 200) console.log(JSON.stringify(res.data));
                        // 歷遍 items 陣列，找到符合 workId 的使用者資料
                        for (const item of res.data.data.items) {
                            if (item.workId === t.signIn.workId) {
                                t.settings.set('signIn.bunitId', item.userComDeptDTO.bunitId);
                                t.settings.set('signIn.divisionId', item.userComDeptDTO.divisionId);
                                t.settings.set('signIn.deptId', item.userComDeptDTO.deptId);
                                t.settings.set('signIn.sectionId', item.userComDeptDTO.sectionId);
                                t.settings.set('signIn.userName', item.userName);

                                // 廣播變更給所有開啟的 Renderer
                                BrowserWindow.getAllWindows().forEach(win => {
                                    win.webContents.send('toRenderer', 'store-changed');
                                });

                                break;
                            }
                        }
                    })(this);
                }
                break;
            }
            case 'getMyStartedWorkItems':
            case 'getMyUnStartedWorkItems':
            case 'getFinishedWorkItems':
            case 'getAllWorkItems': {
                let res = await this._connectSPAS(config);
                if (res.code != 200) {
                    console.log(`${msg.action} FAIL: ${JSON.stringify(res)}`);
                    result = res;
                } else result = res.data;
                break;
            }
            case 'startWorkItem':
            case 'pauseWorkItem':
            case 'extendWorkItem': {
                config.url = config.url + '/' + msg.data.id;
                let res = await this._connectSPAS(config);
                if (res.code != 200) {
                    console.log(`${msg.action} FAIL: ${JSON.stringify(res)}`);
                }
                result = res;
                break;
            }
            case 'finishWorkItem': {
                config.url = config.url + '/' + msg.data.id + '/2';
                let res = await this._connectSPAS(config);
                if (res.code != 200) console.log(`${msg.action} FAIL: ${JSON.stringify(res)}`);
                else {
                    config = new SpasConfig('lastFinishWorkItem');
                    config.data.recieverFunctionBO = res.data.recieverFunctionList;
                    //config.data.remark = "finished.";
                    config.data.workItemPersonId = msg.data.id;
                    res = await this._connectSPAS(config);
                    if (res.code != 200) console.log(`${msg.action} - lastFinishWorkItem FAIL: ${JSON.stringify(res)}`);
                    else result = true;
                }
                break;
            }
            case 'approveItems': {
                result = 0;
                config = new SpasConfig('getMyReviewWorkItem'); // approve的 config與action不同, 分兩個動作
                config.params.workId = this.signIn.workId;
                let res = await this._connectSPAS(config);
                if (res.code != 200) console.log(`${msg.action} FAIL: ${JSON.stringify(res)}`);
                else {
                    for (const i of res.data) {
                        await delay();
                        config = new SpasConfig('reviewWorkItem');
                        config.data.projectWorkItemId = i.projectWorkItemId;
                        this._connectSPAS(config).then(res => {
                            console.log('approve item ' + i.projectWorkItemId + ':' + res.msg);
                            result++;
                        });
                    }
                }
                break;
            }
            case 'getWorkHoursRecordByWorkIdAndDate': {
                config.data.workId = this.signIn.workId;
                config.data.date = new Date().toISOString().split('T')[0];
                let res = await this._connectSPAS(config);
                if (res.code != 200) console.log(`${msg.action} FAIL: ${JSON.stringify(res)}`);
                result = res.data;
                break;
            }
            case 'getClockInData': {
                let s = this.settings.get('signIn');
                config.data.key = s.userName;
                config.data.businessunitId = s.bunitId;
                config.data.divisionId = s.divisionId;
                config.data.departmentId = s.deptId;
                config.data.sectionId = s.sectionId;
                config.data.dateFrom = new Date().toISOString().split('T')[0];
                config.data.dateTo = new Date().toISOString().split('T')[0];
                let res = await this._connectSPAS(config);
                if (res.code != 200) console.log(`${msg.action} FAIL: ${JSON.stringify(res)}`);
                //console.log(JSON.stringify(res));
                result = res.data.items[0];
            }
            default: {
                break;
            }
        }
        return result;
    }

    async _appSignIn() {
        let config = new SpasConfig('appSignIn');
        config.data.workId = this.signIn.workId;
        config.data.password = this.signIn.password;
        config.data.verifyCode = '';
        let res = await axios(config);
        if (res.data.code != 200) {
            console.log('_appSignIn ERROR: ' + res.data.msg);
        } else {
            //console.log("_appSignIn: token updated.");
            this.token = res.data.data.token;
        }
    }

    async _connectSPAS(config) {
        if (!config.valid) return 'config not valid!';
        await this._appSignIn();
        config.headers.token = this.token;

        let res = await axios(config).catch(error => {
            try {
                console.log('response error code ' + error.response.status + ': ' + JSON.stringify(error.response.data));
            } catch (e) {
                console.log(e);
            }
            return error.response;
        });
        //console.log(res);

        // token is not valid, sigin again
        // status = 500 可能代表輸入參數有誤
        if (res.data.code == 1401 || res.data.code == 401 || res.status == 500) {
            try {
                console.log(`_connectSPAS request Error: ${res.status}-${res.data.code} | ${res.data.msg ? res.data.msg : res.data.message}`);
            } catch (e) {
                console.log(e);
            }
            this.token = '';
            this.init();
        }
        return res.data;
    }
}

// Add TimeStamp to Console.log
var log = console.log;
console.log = function () {
    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);

    function formatConsoleDate(date) {
        var hour = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var milliseconds = date.getMilliseconds();

        return '[' + (hour < 10 ? '0' + hour : hour) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds) + '.' + ('00' + milliseconds).slice(-3) + '] ';
    }

    log.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
};

export { SpasConnector };
