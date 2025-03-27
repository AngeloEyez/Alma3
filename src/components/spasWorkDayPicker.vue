<template>
    <div>
        <q-btn round flat dense size="sm" icon="event" @click="openPicker" />

        <q-dialog v-model="isPickerOpen" @hide="saveDateSettings">
            <q-card style="min-width: 330px">
                <q-card-section class="bg-primary text-white row items-center q-py-xs">
                    <div class="text-h6">工作日設定</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section>
                    <q-date ref="datePickerRef" v-model="selectedDate" minimal flat bordered multiple @click="updateWorkDaysFromSelection" @navigation="handleNavigation" calendar-type="gregorian" color="primary" :default-year-month="defaultYearMonth" :navigation-min-year-month="minYearMonth" class="q-pa-none" />
                </q-card-section>
            </q-card>
        </q-dialog>
    </div>
</template>

<script setup>
import { ref, inject, computed, onMounted, toRaw, nextTick } from 'vue';
import { useQuasar } from 'quasar';

const sm = inject('spasManager');
const $q = useQuasar();

const isPickerOpen = ref(false);
const selectedDate = ref([]);
const workDays = ref([]);
const datePickerRef = ref(null); // 創建對 q-date 的引用

const currentView = ref({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
});

// 設置預設年月為當前月
const defaultYearMonth = computed(() => new Date().Format('yyyy/MM'));

// 設置最小可導航月份為當前月份減一個月
const minYearMonth = computed(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
});

// 判斷日期是否為今天
const isToday = dateStr => {
    const today = new Date().Format('yyyy/MM/dd');
    return dateStr === today;
};

// 判斷日期是否為週末
const isWeekend = dateStr => {
    if (!dateStr) return false;
    const dateObj = new Date(dateStr.replaceAll('/', '-'));
    const dayOfWeek = dateObj.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0是星期日，6是星期六
};

// 根據選擇的日期更新工作日設定
const updateWorkDaysFromSelection = () => {
    // 獲取當月所有日期
    const { year, month } = currentView.value;
    const daysInMonth = new Date(year, month, 0).getDate();

    // 比較每一天的選擇狀態，更新workDays
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;

        // 跳過今天的日期
        if (isToday(dateStr)) continue;

        const isSelected = selectedDate.value.includes(dateStr);
        const shouldBeWorkDay = isWeekend(dateStr) ? isSelected : !isSelected;
        const inWorkDays = workDays.value.includes(dateStr);

        // 根據選擇狀態和日期類型調整workDays
        if (shouldBeWorkDay && !inWorkDays) {
            // 需要添加到工作日列表
            workDays.value.push(dateStr);
            console.log(`${dateStr} 已設為${isWeekend(dateStr) ? '工作日' : '休息日'}`);
        } else if (!shouldBeWorkDay && inWorkDays) {
            // 需要從工作日列表移除
            const index = workDays.value.indexOf(dateStr);
            if (index > -1) {
                workDays.value.splice(index, 1);
                console.log(`${dateStr} 已設為${isWeekend(dateStr) ? '休息日' : '工作日'}`);
            }
        }
    }
};

// 處理導航事件
const handleNavigation = view => {
    currentView.value = view;
    updateWorkDayInMonth(view);
};

// 根據當前月份獲取所有天數並檢查是否為工作日
const updateWorkDayInMonth = view => {
    const { year, month } = view;

    // 獲取當月的天數
    const daysInMonth = new Date(year, month, 0).getDate();

    // 清除 selectedDate，重新計算
    selectedDate.value = [];

    // 檢查當月每一天是否為工作日
    for (let day = 1; day <= daysInMonth; day++) {
        // 格式化日期字串 YYYY/MM/DD
        const dateStr = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;

        // 計算該日期是否為工作日
        const isWorkingDay = isWorkDay(dateStr);

        // 如果是工作日，添加到 selectedDate
        if (isWorkingDay) {
            selectedDate.value.push(dateStr);
        }
    }
};

// 判斷日期是否為工作日
const isWorkDay = dateStr => {
    if (!dateStr) return false;

    // 將日期轉換為 Date 對象
    const dateObj = new Date(dateStr.replaceAll('/', '-'));
    const dayOfWeek = dateObj.getDay();

    // 檢查日期是否在 workDays 列表中
    const inWorkDays = workDays.value.includes(dateStr);

    // 週六日: 預設非工作日，但如在 workDays 陣列中則為工作日
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return inWorkDays;
    }
    // 週一至週五: 預設工作日，但如在 workDays 陣列中則為非工作日
    else {
        return !inWorkDays;
    }
};

// 保存日期設定
const saveDateSettings = async () => {
    try {
        // 將 workDays 轉換為純陣列，避免克隆錯誤
        const workDaysArray = [...workDays.value];
        await SPAS.set('workDays', workDaysArray);
        await sm.do('getSettings');

        $q.notify({
            message: '工作日設定已保存',
            color: 'positive',
            position: 'top',
            timeout: 1500
        });
    } catch (error) {
        console.error('保存工作日設定失敗:', error);
        $q.notify({
            message: '保存工作日設定失敗',
            color: 'negative',
            position: 'top',
            timeout: 2000
        });
    }
};

// 打開日期選擇器
const openPicker = async () => {
    isPickerOpen.value = true;
    initDateSettings();
};

// 初始化日期設定
const initDateSettings = async () => {
    // 確保獲取最新設定
    let wD = await SPAS.get('workDays');
    if (wD && Array.isArray(wD)) {
        workDays.value = [...wD];
    } else {
        workDays.value = [];
    }

    await nextTick();
    if (datePickerRef.value) {
        datePickerRef.value.setCalendarTo(defaultYearMonth.value); // 使用引用調用 setCalendarTo
    }

    // 根據當前視圖更新工作日
    updateWorkDayInMonth(currentView.value);
};

// 在組件掛載時初始化
onMounted(() => {
    initDateSettings();
});
</script>
