// Config object defined for SpasConnector Axios

export const PROJECTURL = 'https://spas.efoxconn.com/project-server/api/project';
export const USERURL = 'https://spas.efoxconn.com/user-server/api/user';

export class SpasConfig {
    constructor(cfg) {
        this.valid = true;
        this.msg = '-';
        this.data = {};
        this.params = {};
        this.headers = {
            Accept: 'application/json, text/json, text/x-json, text/javascript, application/xml, text/xml',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json;charset=utf-8',
            'User-Agent': 'RestSharp/106.0.0.0'
        };

        switch (cfg) {
            case 'getKaptchaImg': {
                this.method = 'get';
                this.url = '/getKaptchaImg';
                this.baseURL = USERURL;
                this.params.v = Math.random();
                this.responseType = 'arraybuffer';
                this.headers.Accept = 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';
                delete this.headers['Accept-Encoding'];
                break;
            }
            case 'signIn': {
                this.method = 'post';
                this.url = '/signIn';
                this.baseURL = USERURL;
                this.headers.Accept = 'image/avif,image/webp,*/*';
                delete this.headers['Accept-Encoding'];
                break;
            }
            case 'appSignIn': {
                this.method = 'post';
                this.url = '/appSignIn';
                this.baseURL = USERURL;
                this.headers['Content-Type'] = 'application/json';
                break;
            }
            case 'getUsersByConditions': {
                this.method = 'post';
                this.url = '/getUsersByConditions';
                this.baseURL = USERURL;
                this.headers['Accept-Language'] = 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7,und;q=0.6';
                this.headers['Accept'] = 'application/json, text/plain, */*';
                this.headers['Accept-Encoding'] = 'gzip, deflate, br';
                this.headers['User-Agent'] = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Mobile Safari/537.36';
                this.data = {
                    userId: '',
                    name: '',
                    roleId: '',
                    areaId: '',
                    bunitId: '',
                    divId: '',
                    depId: '',
                    secId: '',
                    isMultifunction: '',
                    status: '',
                    isExcept: '',
                    pageSize: 0,
                    pageNum: 0
                };
                break;
            }
            case 'getMyStartedWorkItems': {
                this.method = 'post';
                this.url = '/getMyStartedWorkItems';
                this.baseURL = PROJECTURL;
                this.data = { keyWord: '' };
                break;
            }
            case 'getMyUnStartedWorkItems': {
                this.method = 'post';
                this.url = '/getMyUnStartedWorkItemsByPage';
                this.baseURL = PROJECTURL;
                this.data = { keyWord: '', page: 1, pageSize: 10 };
                break;
            }
            // case "getMyUnStartedWorkItems": {
            //   this.method = "post";
            //   this.url = "/getMyUnStartedWorkItems";
            //   this.baseURL = PROJECTURL;
            //   this.data = { keyWord: "" };
            //   break;
            // }
            case 'getFinishedWorkItems': {
                this.method = 'post';
                this.url = '/getFinishedWorkItems';
                this.baseURL = PROJECTURL;
                this.data = { keyWord: '' };
                break;
            }
            case 'getAllWorkItems': {
                this.method = 'post';
                this.url = '/getAllWorkItems';
                this.baseURL = PROJECTURL;
                this.data = { keyWord: '' };
                break;
            }
            case 'startWorkItem': {
                this.method = 'get';
                this.url = '/startWorkItem';
                this.baseURL = PROJECTURL;
                break;
            }
            case 'pauseWorkItem': {
                this.method = 'get';
                this.url = '/pauseWorkItem';
                this.baseURL = PROJECTURL;
                break;
            }
            case 'finishWorkItem': {
                this.method = 'get';
                this.url = '/finishWorkItem';
                this.baseURL = PROJECTURL;
                break;
            }
            case 'extendWorkItem': {
                this.method = 'get';
                this.url = '/extendWorkItem';
                this.baseURL = PROJECTURL;
                break;
            }
            case 'lastFinishWorkItem': {
                this.method = 'post';
                this.url = '/lastFinishWorkItem';
                this.baseURL = PROJECTURL;
                this.data.remark = '';
                break;
            }
            case 'getWorkHoursRecordByWorkIdAndDate': {
                this.method = 'post';
                this.url = '/getWorkHoursRecordByWorkIdAndDate';
                this.baseURL = PROJECTURL;
                break;
            }
            case 'getMyReviewWorkItem': {
                this.method = 'get';
                this.url = '/getMyReviewWorkItem';
                this.baseURL = PROJECTURL;
                this.params.workId = '';
                break;
            }
            case 'reviewWorkItem': {
                this.method = 'post';
                this.url = '/reviewWorkItem';
                this.baseURL = PROJECTURL;
                this.data = {
                    files: [],
                    rejectCause: '',
                    type: 1
                };
                break;
            }

            case 'getClockInData': {
                this.method = 'post';
                this.url = '/report/getClockInData';
                this.baseURL = USERURL;
                this.headers['Accept-Language'] = 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7,und;q=0.6';
                this.headers['Accept'] = 'application/json, text/plain, */*';
                this.headers['Accept-Encoding'] = 'gzip, deflate, br';
                this.headers['User-Agent'] = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Mobile Safari/537.36';
                this.data = { area: 1, businessunitId: 0, divisionId: 0, departmentId: 0, sectionId: 0, key: '', pageNum: 1, pageSize: 20, dateFrom: '', dateTo: '' };
                break;
            }

            default: {
                this.valid = false;
                this.msg = `SpasConfig: Can't get config: ${cfg}`;
                if (cfg != 'approveItems') console.log(this.msg);
                break;
            }
        }
    }
}
