/* ===========================================================*/
// SpasManager Class
// Work in renderer process
/* ===========================================================*/
import { calculateBusinessDays, toPercent, delay, timeToDate, addMinutes } from './utils.js';
//import { createWorker, PSM, OEM } from "tesseract.js";

export class SpasManager {
    constructor() {
        this.platforms = new Map();
        this.projectSeries = {};
        this.workItems = []; // [SPAS3.0]
        this.s = { signIn: { workId: '', password: '' } };

        this._lastRunTime = new Date();
        this._workPlanUpdateTime = new Date();
        this.jobRunnerID = null;
        this.timerID = {};

        // 開發模式視圖控制變數，根據環境預設值
        this.devModeView = process.env.NODE_ENV !== 'production';

        this.today = {
            schedule2: ['15:00'],
            clockInTime: '', //上班打卡時間
            desendTime: '', //SPAS系統上計算應下班時間
            endDate: timeToDate('18:30') //ALMA 應下班時間
        };

        this.signInDialog = {
            img: '',
            verifyCode: '',
            msg: '',
            isloading: false,
            showDialog: false
        };

        this.workItemMaxRatio = 0.995;
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

    async do(event, msg) {
        switch (msg) {
            case 'init': {
                this.s = await SPAS.getAllSettings();
                // 監聽 toRenderer channel 來自 main process 的事件
                SPAS.receive('toRenderer', async (_event, eventType, updates) => {
                    if (eventType === 'store-changed') {
                        // 當收到 store-changed 事件時，重新取得所有設定
                        this.s = await SPAS.getAllSettings();
                    }
                });
                console.log('spasManager initialized.');
                SPAS.do('initSpasConnector');
                break;
            }
            case 'start': {
                this.start();
                break;
            }
            case 'needSignIn': {
                this.needSignIn();
                break;
            }
            case 'getSettings': {
                this.s = SPAS.getAllSettings();
            }
            default: {
                break;
            }
        }
    }

    async start() {
        console.log('starting spasManager...');

        await this.getWorkItemsFromSpas();

        // Update Platform properties
        // p.disabled
        this.platforms.forEach(p => {
            p.disabled = this.s.disabledProject.includes(p.id) ? true : false;
        });
        // p.simultaneousGroup
        for (const [name, pidArr] of Object.entries(this.s.simultaneousGroup)) {
            pidArr.forEach(id => {
                let p = this.platforms.get(id);
                if (!p.simultaneousGroup.includes(name)) p.simultaneousGroup.push(name);
            });
        }

        //await this.calWorkPlan(); // 計算platforms todayTargetHours

        console.log('start: get clockin and desend Time');
        SPAS.do('getClockInData').then(res => {
            console.log('getClockInData:', res);
            this.today.clockInTime = res.inTime;
            try {
                let t = res.dsendTime.split(' ')[1].split(':'); //dsendTime: "2022-10-03 17:38:00"
                this.today.desendTime = t[0] + ':' + t[1]; // "17:38"
                console.log(`更更新上班時間: ${this.today.clockInTime},工作截止時間: ${this.today.desendTime}`);
                this.calWorkPlan();
                this._jobRunner();
            } catch (e) {
                console.log(`getClockInData Fail: ${e}, res:`, res);
            }
        });

        this.jobRunnerID = setInterval(this._jobRunner.bind(this), 55000); // 55秒
        console.log('spasManager Started');
    }

    stop() {
        clearInterval(this.jobRunnerID);
        console.log('jobRunnerID cleared.');
    }

    calTodayEndTime() {
        // endTime預設 +1分鐘
        this.today.endDate = timeToDate(this.s.workEndTime, 1);
        if (this.today.desendTime != '') {
            if (this.s.useSpasEndTime) this.today.endDate = timeToDate(this.today.desendTime, 1);
            if (this.today.endDate < timeToDate(this.today.desendTime, 1)) this.today.endDate = timeToDate(this.today.desendTime, 1);
        }
    }

    async _jobRunner() {
        let date = new Date();
        let updateWorkItem = false;

        // 特定時間執行 0 -------------------------------------------------------------------- [改成每日下班後10分鐘]
        let scheduleTime0 = ['23:05'];
        if (scheduleTime0.includes(date.myGetTime())) {
            console.log('schedule0: Check FINISH and APPROVE');
            await this.getWorkItemsFromSpas();
            await this.finishItems();
            this.approveItems();
            this.calWorkPlan();
        }
        // 特定時間執行 1 --------------------------------------------------------------------
        let scheduleTime1 = ['08:00', '10:00', '12:03', '13:30', '13:32', '15:00', '17:30', '18:30', '20:00', '22:00'];
        if (scheduleTime1.includes(date.myGetTime())) {
            console.log('schedule1: refresh workItem.');
            await this.getWorkItemsFromSpas();
            this.calWorkPlan();
        }

        // 特定時間執行 2 --------------------------------------------------------------------
        // 取得 上班時間，SPAS系統於 16:40 左右抓取上班時間
        let scheduleTime2 = ['15:00', '16:00', '16:40', '16:50', '17:00', '17:10', '17:20', '17:30', '17:50'];
        if (scheduleTime2.includes(date.myGetTime())) {
            console.log(`schedule2: get clockin and desend Time. (clockInTime:${this.today.clockInTime})`);
            if (this.today.clockInTime != null) {
                SPAS.do('getClockInData').then(res => {
                    this.today.clockInTime = res.inTime;
                    try {
                        let t = res.dsendTime.split(' ')[1].split(':'); //dsendTime: "2022-10-03 17:38:00"
                        this.today.desendTime = t[0] + ':' + t[1]; // "17:38"
                        console.log(`更更新上班時間: ${this.today.clockInTime},工作截止時間: ${this.today.desendTime}`);
                        this.calWorkPlan();
                    } catch (e) {
                        console.log(`getClockInData Fail: ${e}, res:`, res);
                    }
                });
            }
        }

        // 特定時間執行 3 A new Day --------------------------------------------------------------------
        if (this.s.workStartTime == date.myGetTime()) {
            console.log('Start a new Day...');
            this.today.desendTime = '';
            this.today.clockInTime = '';
            // for (const i of this.onGoingWorkItems) {
            //   //if (!(await i.extend())) {
            //   await i.pause();
            //   //}
            // }
        }

        // 不在工作時間內 --------------------------------------------------------------------
        this.calTodayEndTime(); // 計算本日下班時間
        console.log(`today.endDate:${this.today.endDate} | today.desendTime:${this.today.desendTime}`);
        if (date < timeToDate(this.s.workStartTime, -1) || date > this.today.endDate || (date > new Date().setHours(12, 1, 0) && date < new Date().setHours(13, 29, 0)) || date.getDay() == 0 || date.getDay() == 6) {
            //pause all ongoingWorkItems
            //console.log(`_jobRunner: not in working time, pause all workitems. ${this.s.workStartTime}~${endTime}`);
            for (const i of this.onGoingWorkItems) {
                i.pause();
            }
            this.getWorkItemsFromSpas();
            // 在工作時間內 --------------------------------------------------------------------
        } else {
            // 更新 workPlan (每日剛開始工作時)
            if (this._workPlanUpdateTime.getDate() != date.getDate()) {
                console.log(`Calculate today's workplan`);
                await this.getWorkItemsFromSpas();
                await this.calWorkPlan();
            }

            // //*把所有onGoing更新時間
            // for (const i of this.onGoingWorkItems) {
            //     const delta = (new Date() - this._lastRunTime) / 3600000;
            //     let p = this.platforms.get(i.platformId);
            //     p.consumeHours(i.id, delta);
            //     //console.log(`running item: ${i.id}(${toPercent(i.ratio)} / ${toPercent(p.maxRatio)})|platform todayTargetHours - ${p.todayTargetHours.toFixed(3)} `);

            //     //當日targetHours用完就暫停該item
            //     if (p.todayTargetHours <= 0 || i.ratio >= 0.99) {
            //         //console.log(`_jobRunner: pasue workitem due to p.todayTargetHours:${p.todayTargetHours} | i.ratio:${i.ratio}`);
            //         if (await i.pause()) {
            //             console.log(`job pause done (${p.name})`);
            //             updateWorkItem = true;
            //         }
            //     } else if (i.ratio > i.maxRatio) {
            //         // 要停嗎? 考慮萬一沒有工作了必須超過?
            //     }
            // }

            // //*如果沒有onGoing, start一個新item
            // if (this.onGoingWorkItems.length == 0) {
            //     console.log('no running workitem.. start a new one...');
            //     let sortedPlt = [...this.platforms.values()].sort((a, b) => a.todayTargetHours - b.todayTargetHours); //按照todayTargetHours小到大排序, 先跑小的porject

            //     sortedPlt.forEach(p => {
            //         console.log(`Sorted Plan: ${p.id} - ${p.todayTargetHours}`);
            //     });

            //     for (const p of sortedPlt) {
            //         if (p.todayTargetHours > 0 && p.status == 2) {
            //             let item = await p.start(); //return item or null
            //             if (item) {
            //                 console.log(`job start done (${p.name})`);
            //                 updateWorkItem = true;

            //                 // 啟動 simultaneousGroup內的專案
            //                 p.simultaneousGroup.forEach(gName => {
            //                     this.platforms.forEach(plt => {
            //                         if (plt.simultaneousGroup.includes(gName) && plt.status == 2) {
            //                             console.log(`start simultaneousGroup ${gName}-(${plt.id})${plt.name}`);
            //                             plt.start(item.name);
            //                         }
            //                     });
            //                 });

            //                 break; //[ToDo] 一個platform只開始一個workItem...?
            //             }
            //         }
            //     }
            // }

            // [SPAS3.0]
            // *把所有onGoing更新時間
            for (const i of this.onGoingWorkItems3) {
                const delta = (new Date() - this._lastRunTime) / 3600000;

                // 使用Array.prototype.find()找到id為888的物件
                const foundItem = this.workItems.find(item => item.id === i.id);
                if (foundItem) {
                    foundItem.consumeHours(delta);
                    //當日targetHours用完就暫停該item
                    if (foundItem.targetHours <= 0 || foundItem.ratio >= this.workItemMaxRatio) {
                        if (await i.pause()) {
                            console.log(`job pause done: (${i.id})${i.name}`);
                            updateWorkItem = true;
                        }
                    }
                } else {
                    console.log(`ERROR!! this.workItems中找不到符合條件的物件 id=${i.id}`);
                }
            }
            console.log(`目前有 ${this.onGoingWorkItems3.length} 個工作項同時進行`);
            //* 一次僅進行一個工作，停止多餘的
            if (this.onGoingWorkItems3.length > 1) {
                console.log(`目前有 ${this.onGoingWorkItems3.length} 個工作項同時進行,開始暫停多餘項目`);
                const OGworkItems = this.onGoingWorkItems3;

                for (const i of OGworkItems) {
                    i.pause();
                }
                await this.getWorkItemsFromSpas();
                await this.calWorkPlan();
                console.log(`目前有 ${this.onGoingWorkItems3.length} 個工作項同時進行`);
            }

            //*如果沒有onGoing, start一個新item
            if (this.onGoingWorkItems3.length == 0) {
                // 使用 reduce 找出 targetHours 最大且大於 0 的物件
                let maxItem = this.workItems.reduce(
                    (maxItem, currentObject) => {
                        if (currentObject.targetHours > 0 && currentObject.targetHours > maxItem.targetHours) {
                            return currentObject;
                        }
                        return maxItem;
                    },
                    { targetHours: -Infinity }
                ); // 初始值設為 Infinity，以確保第一個符合條件的物件一定會被選取

                if (maxItem.targetHours === -Infinity) {
                    console.log(`所有 workItem 的 targetHours 皆為 0, 請重新安排 workPlan!`);
                } else if (maxItem.targetHours > 0) {
                    maxItem.start();
                } else {
                    console.log(`Unknown Error!!?`);
                }
            }

            //*如果有尚未開始且已經過了開始日期的workItem, 直接開始
            this.workItems.forEach(i => {
                if (i.startTime < date && i.investedHours == 0) {
                    i.start();
                }
            });
        }

        this._lastRunTime = date; // 最後更新_lastRunTime
        if (updateWorkItem) {
            this.getWorkItemsFromSpas();
        }
    }

    async calWorkPlan() {
        // SPAS2.0 Start ----------------------
        // let todayTotalHour = 0;
        // let arr = [];

        // let workStartDate = timeToDate(this.s.workStartTime);
        // let workEndDate = timeToDate(this.s.workEndTime, 1);

        // if (this.today.desendTime != '') {
        //     if (workEndDate < timeToDate(this.today.desendTime, 1)) workEndDate = timeToDate(this.today.desendTime, 1);
        // }

        // //
        // // 加總今天platforms所需要的時數
        // this.platforms.forEach(p => {
        //     arr.push(p.hoursPerDay);
        //     todayTotalHour += p.hoursPerDay;
        // });

        // console.log(arr);
        // // p.simultaneousGroup
        // let sg = {};
        // for (const [name, pidArr] of Object.entries(this.s.simultaneousGroup)) {
        //     let pHoursMax = 0;
        //     pidArr.forEach(id => {
        //         let p = this.platforms.get(id);
        //         if (p.hoursPerDay > pHoursMax) {
        //             todayTotalHour -= pHoursMax;
        //             sg[name] = id;
        //             pHoursMax = p.hoursPerDay;
        //         } else {
        //             todayTotalHour -= p.hoursPerDay;
        //         }
        //     });
        // }
        // let jj = 0;
        // this.platforms.forEach(p => {
        //     if (p.simultaneousGroup[0] != null) {
        //         if (sg[p.simultaneousGroup[0]] != p.id) {
        //             arr[jj] = 0;
        //         }
        //     }
        //     jj++;
        // });
        // console.log(arr);

        // // todayAvailableHours: 今天可以工作的時數
        // let date = new Date();
        // let todayAvailableHours = workEndDate - (date < workStartDate ? workStartDate : date);

        // // 扣除午休1.5hr
        // let wakeupTime = new Date().setHours(13, 30, 0);
        // let nap = 0;
        // if (wakeupTime - date > 90 * 60 * 1000) {
        //     nap = 90 * 60 * 1000;
        // } else if (wakeupTime - date > 0) {
        //     nap = wakeupTime - date;
        // }
        // todayAvailableHours -= nap;

        // todayAvailableHours = todayAvailableHours < 0 ? 0 : todayAvailableHours / 3600000;
        // console.log(`todayTotalHour: ${todayTotalHour.toFixed(3)} | todayAvailableHours: ${todayAvailableHours.toFixed(3)}`);

        // // platform所占百分比 x 今天完整工作的小時數
        // arr = arr.map(v => {
        //     let r = ((v / todayTotalHour) * (workEndDate - workStartDate)) / 3600000;
        //     return r;
        // });
        // //console.log(arr);

        // // 寫入各platform todayTargetHours
        // let j = 0;
        // this.platforms.forEach(p => {
        //     p.todayTargetHours = arr[j++];
        // });

        // // 取得今天已經執行的工作時數, 並從該platform todayTargetHours扣除
        // await delay(300, 1100);
        // let res = await SPAS.do('getWorkHoursRecordByWorkIdAndDate');
        // //console.log(res.workHoursRecordDTOList);
        // let today = new Date().toISOString().split('T')[0];
        // res.workHoursRecordDTOList.forEach(i => {
        //     let p = this.getPlatformByWorkItemId(i.workitemPersonId); //這邊的i是小寫 -_-
        //     if (p != null || i.recordDate != today) {
        //         if (i.endTime == null) {
        //             p.todayTargetHours -= (date.getTime() - i.startTime * 1000) / 3600000;
        //             console.log(`${p.id} - found job done until now: ${(date.getTime() - i.startTime * 1000) / 3600000}`);
        //         } else {
        //             p.todayTargetHours -= (i.endTime - i.startTime) / 3600;
        //             console.log(`${p.id} - found job done : ${(i.endTime - i.startTime) / 3600}`);
        //         }
        //     } else {
        //         console.log(`found job done not in project list?? i.workitemPersonId=${i.workitemPersonId} | today = ${today}`);
        //     }
        // });

        // // 重新換算今日剩餘可工作時數
        // todayTotalHour = 0;
        // let r = {};
        // this.platforms.forEach(p => {
        //     todayTotalHour += p.todayTargetHours;
        // });

        // // 寫入每個project 的 todayTargetHours
        // this.platforms.forEach(p => {
        //     p.todayTargetHours = (p.todayTargetHours / todayTotalHour) * todayAvailableHours;
        // });

        // // 若有 simultaneousGroup, 則更新todayTargetHours為該group中最大的值
        // for (const [name, pidArr] of Object.entries(this.s.simultaneousGroup)) {
        //     let targetHourSum = 0;
        //     console.log(pidArr);
        //     pidArr.forEach(id => {
        //         targetHourSum += this.platforms.get(id).todayTargetHours;
        //     });

        //     pidArr.forEach(id => {
        //         this.platforms.get(id).todayTargetHours = targetHourSum;
        //     });
        // }
        // SPAS2.0 End ----------------------

        // [SPAS3.0]
        this.calWorkPlanByWorkItem(); // switch to SPAS 3.0 plan

        this._workPlanUpdateTime = new Date();
        console.log('work plan updated.');
    }

    // [SPAS3.0] plan logic
    async calWorkPlanByWorkItem(workItemsPerDay = 4) {
        // ==== 計算今日剩餘可工作時數 ===========================================================================================
        if (!this.s.workStartTime) this.s = await SPAS.getAllSettings(); // 預防動態更新時 this.s內容丟失

        let date = new Date();

        let workStartDate = timeToDate(this.s.workStartTime);
        workStartDate = date < workStartDate ? workStartDate : date;

        this.calTodayEndTime(); // 計算本日下班時間 this.today.endDate
        let workEndDate = this.today.endDate;

        // workHoursAvalible: 今天可以工作的時數
        let workHoursAvalible = workEndDate - workStartDate;

        // 扣除午休1.5hr
        let wakeupTime = new Date().setHours(13, 30, 0);
        let nap = 0;
        if (wakeupTime - date > 90 * 60 * 1000) {
            nap = 90 * 60 * 1000;
        } else if (wakeupTime - date > 0) {
            nap = wakeupTime - date;
        }
        workHoursAvalible -= nap;

        workHoursAvalible = workHoursAvalible < 0 ? 0 : workHoursAvalible / 3600000;
        console.log(`今日剩餘工作時數: ${workHoursAvalible.toFixed(3)} (${workStartDate.toLocaleTimeString()}~${workEndDate.toLocaleTimeString()})`);

        // ==== 計算 priorityScore ===========================================================================================
        let minScore = 0;
        this.workItems.forEach(i => {
            i.targetHours = 0;
            i.priorityScore = 0;

            let ratioScore = i.ratio * 100; //完成度分數
            let dateScore = (i.endTime - Date.now()) / (24 * 60 * 60 * 1000); // 剩餘天數分數 (天)

            i.priorityScore = i.priorityScore - ratioScore - dateScore;

            minScore = minScore < i.priorityScore ? minScore : i.priorityScore;
        });

        this.workItems.forEach(i => {
            // 將 priorityScore shift到正數 (minScore為最小的score, 負數)
            i.priorityScore -= minScore;

            //已過期工作priorityScore歸零
            if (i.endTime - Date.now() < 0) i.priorityScore = 0;

            // 已達this.workItemMaxRatio的工作項 priorityScore歸零
            if (i.ratio >= this.workItemMaxRatio) i.priorityScore = 0;
        });

        // 根據priorityScore對工作項目進行排序 (priorityScore大的在前面)
        this.workItems.sort((a, b) => b.priorityScore - a.priorityScore);

        // 获取前幾個个工作项 (workItemsPerDay), 並排除 priorityScore=0 的項目
        if (workHoursAvalible < 0.5) workItemsPerDay = 2;
        if (workHoursAvalible < 0.2) workItemsPerDay = 1;
        const topItems = this.workItems.filter(i => i.priorityScore !== 0).slice(0, workItemsPerDay);

        // 计算 priorityScore 的总和
        const totalPriorityScore = topItems.reduce((total, workItem) => total + workItem.priorityScore, 0);

        // ==== 分配每個工作項目的時間 ===========================================================================================
        let workHoursLeft = workHoursAvalible;
        for (const workItem of topItems) {
            if (workItem.priorityScore <= 0) continue;
            if (workHoursLeft > 0) {
                let allocatedHours = Math.min(workHoursAvalible * (workItem.priorityScore / totalPriorityScore), workItem.pmHours - workItem.investedHours, workHoursLeft);
                workItem.targetHours = allocatedHours;
                workHoursLeft -= allocatedHours;
                //console.log(`${workItem.id} ${((workItem.personalInvestedHours * 100) / workItem.pmHours).toFixed(1)}% (${(workItem.pmHours - workItem.investedHours).toFixed(2)})${workItem.endTime.Format('yyyy-MM-dd')}  ${workItem.priorityScore.toFixed(4)} ${workItem.owners.length} ${workItem.targetHours} | ${workHoursLeft}`);
            }
        }
    }

    async getWorkItemsFromSpas() {
        const psSet = new Set();
        const pSet = new Set();
        const iSet = new Set();

        await delay(200, 900);
        let res = await SPAS.do('getMyStartedWorkItems');
        //console.log('getMyStartedWorkItems', res);
        res.forEach(async item => {
            psSet.add(item.projectSeriesId);
            pSet.add(item.platformFoundId);
            iSet.add(item.workItemPersonId);
            this._setWorkItem(item);
        }, this);

        res = await SPAS.do('getMyUnStartedWorkItems');
        //console.log('getMyUnStartedWorkItems',res)
        res.forEach(function (plt) {
            plt.workItemInfoDTOS.forEach(async function (item) {
                item.startTime = plt.startTime; // for platform
                item.endTime = plt.endTime; // for platform
                item.projectSeriesId = plt.projectSeriesId;
                item.platformFoundId = plt.platformFoundId;
                item.platformFoundName = plt.platformFoundName;
                item.platformFoundStatus = plt.platformFoundStatus;
                psSet.add(item.projectSeriesId);
                pSet.add(item.platformFoundId);
                iSet.add(item.workItemPersonId);
                this._setWorkItem(item);
            }, this);
        }, this);

        // 此次更新 server上沒有的項目刪除
        this.platforms.forEach(p => {
            if (!pSet.has(p.id)) {
                console.log(`delete platform ${p.id}`);
                this.platforms.delete(p.id);
            } else {
                p.workItems.forEach(i => {
                    if (!iSet.has(i.id)) {
                        console.log(`delete workitem ${i.id} from ${p.id}`);
                        p.workItems.delete(i.id);
                    }
                });
            }
        });
        for (const psId in this.projectSeries) {
            if (!psSet.has(Number(psId))) {
                // for..in 會固定輸出string...
                console.log(`delete projectSeries ${psId}`);
                delete this.projectSeries[psId];
            }
        }

        // [SPAS3.0]
        // 刪除server不存在之workITem
        // 使用 Array.prototype.filter() 保留 id 存在於 iSet 中的物件
        const conA = this.workItems.length;
        this.workItems = this.workItems.filter(item => iSet.has(item.id));

        //console.log(`更新 ${this.workItems.length} workItems. 移除 ${conA - this.workItems.length} workItems`);
        //console.log(`this.workItems:`, this.workItems);
    }

    get onGoingWorkItems() {
        let arr = [];
        this.platforms.forEach(p => {
            p.workItems.forEach(i => {
                if (i.status == 1) arr.push(i); //status=1 is running
            });
        });
        return arr;
    }

    get onGoingWorkItems3() {
        let arr = [];
        this.workItems.forEach(i => {
            if (i.status == 1) arr.push(i); //status=1 is running
        });

        return arr;
    }

    get simultaneousGroups() {
        let sKeys = new Set();
        this.platforms.forEach(p => {
            p.simultaneousGroup.forEach(s => sKeys.add(s));
        });
        return Array.from(sKeys);
    }

    _setWorkItem(obj) {
        //Platform不覆蓋, 但要更新屬性
        if (!this.platforms.has(obj.platformFoundId)) this.platforms.set(obj.platformFoundId, new spasPlatform(obj));
        if (!this.projectSeries.hasOwnProperty(obj.projectSeriesId) && obj.projectSeriesId != undefined) this.projectSeries[obj.projectSeriesId] = new spasProjectSeries(obj);
        this.platforms.get(obj.platformFoundId).setWorkItem(obj);

        // [SPAS3.0]
        // 判斷 workItem是否已經存在 this.workItems
        const existItemIndex = this.workItems.findIndex(item => item.id === obj.workItemPersonId);
        if (existItemIndex !== -1) {
            // 存在，則更新內容, 保留 workItem.targetHours 以及 workItem.priorityScore
            obj.targetHours = this.workItems[existItemIndex].targetHours;
            obj.priorityScore = this.workItems[existItemIndex].priorityScore;
            this.workItems.splice(existItemIndex, 1); // 移除此 workItem;
            this.workItems.push(new spasWorkItem(obj));
        } else {
            // 不存在，則直接新增
            this.workItems.push(new spasWorkItem(obj));
        }
    }

    async finishItems() {
        // this.platforms.forEach(p => {
        //     p.workItems.forEach(async i => {
        //         if (i.endTime < new Date()) {
        //             i.finish();
        //             await delay();
        //         }
        //     });
        // });

        let now = new Date();

        this.workItems.forEach(async i => {
            // workItem.endTime訂在 22:59:59
            if (i.endTime < now) {
                i.finish();
                await delay();
            }
        });

        this.getWorkItemsFromSpas();
    }

    approveItems() {
        console.log('approving items...');
        SPAS.do('approveItems').then(res => {
            console.log(`${res} items approved.`);
        });
    }

    getPlatformByWorkItemId(id) {
        for (const p of this.platforms.values()) {
            for (const i of p.workItems.values()) {
                if (i.id == id) {
                    return p;
                }
            }
        }
        return null;
    }

    async needSignIn() {
        this.stop();
        let res = await SPAS.do('getKaptchaImg');
        //this._recognizeImg(res.img);
        this.signInDialog.img = res.img;
        this.signInDialog.verifyCode = res.verifyCode;
        this.signInDialog.isloading = false;
        this.signInDialog.showDialog = true;
    }

    async signIn() {
        console.log('SpasManager.singIn called');
        this.signInDialog.isloading = true;
        this.signInDialog.msg = '';
        let data = { workId: this.s.signIn.workId, password: this.s.signIn.password, verifyCode: this.signInDialog.verifyCode };
        let res = await SPAS.do('signIn', data);
        console.log(res);
        if (res.result) {
            // signIn success
            this.signInDialog.showDialog = false;
            this.start();
        } else {
            // signIn fail
            this.signInDialog.msg = res.msg;
            this.needSignIn();
        }
    }

    _recognizeImg(img) {
        const worker = createWorker({
            logger: m => console.log(m)
        });

        (async () => {
            await worker.load();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            await worker.setParameters({
                //tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyz"
            });
            const {
                data: { text }
            } = await worker.recognize('data:image/jpeg;base64,' + img);
            console.log(text);
            this.signInDialog.verifyCode = text;
            await worker.terminate();
        })();
    }

    updatePrjProp() {
        const dp = [];
        this.platforms.forEach(p => {
            if (p.disabled) dp.push(p.id);
        });
        this.s.disabledProject = dp;
        this.calWorkPlan();
        SPAS.set('disabledProject', dp);
    }

    setSimultaneousProjects(name, idArr, isAddMode) {
        if (!isAddMode) {
            // Modify mode, 先清掉所有此group的project
            this.platforms.forEach(p => {
                p.simultaneousGroup = p.simultaneousGroup.filter(v => v != name);
            });
        }

        idArr.forEach(id => {
            let p = this.platforms.get(id);
            if (!p.simultaneousGroup.includes(name)) p.simultaneousGroup.push(name);
        });

        //寫入settings
        let groups = {};
        this.platforms.forEach(p => {
            p.simultaneousGroup.forEach(groupName => {
                if (groups.hasOwnProperty(groupName)) {
                    groups[groupName].push(p.id);
                } else {
                    groups[groupName] = [p.id];
                }
            });
        });

        SPAS.set('simultaneousGroup', groups);
        this.s.simultaneousGroup = groups;
    }
}

// Construct with Spas returned workItem object
class spasWorkItem {
    constructor(obj) {
        //this.id = obj.projectWorkItemId;
        this.id = obj.workItemPersonId;
        this.name = obj.workItemName;

        this.projectSeriesId = obj.projectSeriesId;
        this.projectSeriesName = obj.projectSeriesName;

        this.platformId = obj.platformFoundId;
        this.platformName = obj.platformFoundName;

        this.pmHours = Number(obj.pmHours);
        this.investedHours = Number(obj.totalInvestedHours ?? 0);
        this.personalInvestedHours = Number(obj.personalTotalInvestedHours ?? 0);

        this.targetHours = obj.targetHours ?? 0;
        this.priorityScore = obj.priorityScore ?? 0;

        this.owners = obj.owners;
        this.status = obj.status; // 1 = started, 2 = paused

        // 优先使用 workItemStartDate 与 workItemEndDate (SPAS 3.0)
        if (obj.workItemStartDate) {
            // started Item
            this.startTime = new Date(obj.workItemStartDate + 'T00:00:00');
        } else if (obj.startDate) {
            // unStarted Item
            this.startTime = new Date(obj.startDate + 'T00:00:00');
        } else {
            // platform time
            this.startTime = new Date(obj.startTime + 'T00:00:00');
        }

        if (obj.workItemEndDate) {
            // started Item
            this.endTime = new Date(obj.workItemEndDate + 'T22:59:59');
        } else if (obj.endDate) {
            // unStarted Item
            this.endTime = new Date(obj.endDate + 'T22:59:59');
        } else {
            // platform time
            this.endTime = new Date(obj.endTime + 'T22:59:59');
        }

        this.todayTargetHours = 0;
    }

    get ratio() {
        return this.investedHours / this.pmHours;
    }

    consumeHours(delta) {
        this.investedHours += delta;
        this.targetHours -= delta;
    }

    async start() {
        let data = { id: this.id };
        let rtn = false;
        let res = await SPAS.do('startWorkItem', data);
        //{"code":200,"msg":"success","data":null}

        if (res.code == 200) {
            this.status = 1; // status=1 running
            rtn = true;
        }
        console.log(`(${this.id})${this.name} started : ${res.code} | ${res.msg}`);
        return rtn;
    }

    async pause() {
        let data = { id: this.id };
        let rtn = false;
        let res = await SPAS.do('pauseWorkItem', data);
        //{"code":200,"msg":"success","data":null}

        if (res.code == 200) {
            this.status = 2; // status=2 paused
            rtn = true;
        }
        console.log(`(${this.id})${this.name} pasued : ${res.code} | ${res.msg}`);
        return rtn;
    }

    async extend() {
        let data = { id: this.id };
        let rtn = false;
        let res = await SPAS.do('extendWorkItem', data);
        //{"code":200,"msg":"success","data":null}
        //{"code":1460,"msg":"workhours not allow extend","data":null}

        if (res.code == 200) {
            this.status = 2; // status=2 pasued. extend does not start job.
            rtn = true;
        }
        console.log(`(${this.id})${this.name} extended at ${new Date().myGetTime()} : ${res.code} | ${res.msg}`);
        return rtn;
    }

    async finish() {
        if (this.investedHours <= 0) {
            console.log(`Start ${this.id} before finish it...`);
            await this.start();
        }
        let data = { id: this.id };
        let res = await SPAS.do('finishWorkItem', data);
        if (res != true) console.log(`${this.id}-${this.name} finishe FAIL. (${res})`);
        else {
            console.log(`${this.id}-${this.name} finished. (${res})`);
        }
        return res == true ? true : false;
    }
}

class spasPlatform extends spasWorkItem {
    constructor(obj) {
        super(obj);
        this.id = obj.platformFoundId;
        this.name = obj.platformFoundName;
        this._status = obj.platformFoundStatus;
        this.workItems = new Map();
        this.simultaneousGroup = [];

        // platform start/end time 与 workItem 独立
        this.startTime = new Date(obj.startTime + 'T00:00:00');
        this.endTime = new Date(obj.endTime + 'T22:59:59');

        this.disabled = false;
        this._todayTargetHours = 0;
        //this.itemStartedTime = null;
    }

    /**
     * 開始專案的一個workItem, 並return 該item
     * @param {String} item name for simultenenou start
     * @returns item or null
     */
    async start(name = '') {
        let item = { ratio: 1, dummy: true };
        // 找出ratio最小的workItem 或 同名稱的 workItem for simultenenou start
        for (const i of this.workItems.values()) {
            if (name == '') {
                if (i.ratio < item.ratio && i.ratio < this.maxRatio) item = i;
            } else {
                if (i.name == name && i.ratio < this.maxRatio) item = i;
            }
        }
        if (item.hasOwnProperty('dummy')) {
            console.log(`Can't find workItem to start for platform: (${this.id})${this.name}`);
            return null;
        } else {
            console.log(`found item ratio: ${toPercent(item.ratio)} / projMaxRatio: ${toPercent(this.maxRatio)}`);
            if (await item.start()) {
                return item;
            } else {
                console.log(`Platform start workItem fail: (${this.id})${this.name}`);
                return null;
            }
        }
    }

    setWorkItem(obj) {
        this.startTime = new Date(obj.startTime + 'T00:00:01');
        this.endTime = new Date(obj.endTime + 'T22:59:59');
        this.workItems.set(obj.workItemPersonId, new spasWorkItem(obj));
        //console.log(`setWorkItem: ${obj.workitemPersonId} | ${obj.status} : ${obj.workItemName} | ${this.startTime}~${this.endTime}`);
    }

    consumeHours(itemId, delta) {
        this.todayTargetHours -= delta;
        this.workItems.get(itemId).consumeHours(delta);
    }

    set status(v) {}
    get status() {
        let s = 2;
        this.workItems.forEach(i => {
            if (i.status == 1) s = 1;
        });
        return s;
    }

    set todayTargetHours(v) {
        this._todayTargetHours = v < 0 ? 0 : v;
    }
    get todayTargetHours() {
        return this._todayTargetHours;
    }

    //加總 platform hpmHours
    set pmHours(v) {}
    get pmHours() {
        let h = 0;
        this.workItems.forEach(i => {
            h += i.pmHours;
        });
        return h;
    }

    //加總 platform investedHours
    set investedHours(v) {}
    get investedHours() {
        let h = 0;
        this.workItems.forEach(i => {
            h += i.investedHours > i.pmHours ? i.pmHours : i.investedHours; // 超過時數的 item 仍然只算pmhours, 避免整個project investedHours 爆表
        });
        return h;
    }

    // Platform最高能完成的比例  [Todo] 修正8
    get maxRatio() {
        let businessDays = calculateBusinessDays(this.startTime, this.endTime);
        let ratio = (businessDays * 8) / this.pmHours;
        return ratio > 1 ? 1 : ratio;
    }

    // Platform 每天需消耗工時
    get hoursPerDay() {
        if (this.disabled) return 0;
        let businessDays = calculateBusinessDays(new Date(), this.endTime);
        let leftWorkHours = this.pmHours - this.investedHours;

        return businessDays > 0 ? leftWorkHours / businessDays : 0;
    }
}

class spasProjectSeries {
    constructor(obj) {
        this.id = obj.projectSeriesId;
        this.name = obj.projectSeriesName;
    }
}
