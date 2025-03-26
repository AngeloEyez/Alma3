<template>
    <q-card flat bordered>
        <q-card-section class="bg-light-blue-8 text-white q-py-xs">
            <div class="row q-gutter-y-xs">
                <!-- 第一列 -->
                <div class="col-12 row items-center q-gutter-x-xs">
                    <div class="col-2 text-caption">
                        <q-icon name="access_time" size="xs" class="q-mr-xs" />
                        預設上班: {{ sm.s.workStartTime }}
                    </div>
                    <div class="col-2 text-caption">
                        <q-icon name="login" size="xs" class="q-mr-xs" />
                        今日打卡: {{ sm.today.clockInTime || '--:--' }}
                    </div>
                    <div class="col-2 text-caption">
                        <q-icon name="play_arrow" size="xs" class="q-mr-xs" />
                        ALMA上班: {{ sm.today.startTime || '--:--' }}
                    </div>
                    <div class="col-auto">
                        <q-btn :color="sm.today.isWorkDay ? 'green' : 'grey'" size="sm" :label="sm.today.isWorkDay ? '工作日' : '休息日'" dense no-caps @click="toggleWorkDay" />
                    </div>
                    <div class="col text-caption text-right">
                        <q-icon name="favorite" size="xs" class="q-mr-xs" />
                        {{ sm._lastRunTime ? new Date(sm._lastRunTime).Format('hh:mm:ss') : '--:--' }}
                    </div>
                </div>

                <!-- 第二列 -->
                <div class="col-12 row items-center q-gutter-x-xs">
                    <div class="col-2 text-caption">
                        <q-icon name="access_time" size="xs" class="q-mr-xs" />
                        預設下班: {{ sm.s.workEndTime }}
                    </div>
                    <div class="col-2 text-caption">
                        <q-icon name="logout" size="xs" class="q-mr-xs" />
                        今日下班: {{ sm.today.desendTime || '--:--' }}
                    </div>
                    <div class="col-2 text-caption">
                        <q-icon name="phonelink_erase" size="xs" class="q-mr-xs" />
                        ALMA下班: {{ sm.today.endDate ? sm.today.endDate.Format('hh:mm') : '--:--' }}
                    </div>
                    <div class="col-auto">
                        <q-btn color="grey" size="sm" label="功能待開發" dense no-caps disabled />
                    </div>
                </div>
            </div>
        </q-card-section>
    </q-card>

    <!-- 開發模式區域 -->
    <q-card v-if="sm.devModeView" flat bordered class="q-mt-xs">
        <q-card-section class="q-py-xs q-px-md">
            <div class="row q-gutter-sm">
                <q-input v-model="sm.today.schedule2" label="today.schedule2" dense class="col-12 col-sm-6" />
                <div class="row q-gutter-xs">
                    <q-btn color="grey-7" label="test" dense no-caps @click="test" />
                    <q-btn color="grey-7" label="getWorkItemsFromSpas" dense no-caps @click="sm.getWorkItemsFromSpas()" />
                    <q-btn color="grey-7" label="calWorkPlanByWorkItem" dense no-caps @click="sm.calWorkPlanByWorkItem(4)" />
                    <q-btn color="grey-7" label="approveItems" dense no-caps @click="sm.approveItems" />
                    <q-btn color="grey-7" label="finishItems" dense no-caps @click="sm.finishItems" />
                </div>
            </div>
        </q-card-section>

        <q-card-section v-if="Object.keys(sm.onGoingWorkItems3 || {}).length" class="q-pt-none q-px-md">
            <q-list dense padding class="q-py-none">
                <q-item v-for="(value, key) in sm.onGoingWorkItems3" :key="key" class="q-py-xs">
                    <q-item-section class="text-caption">{{ key }}: {{ value.id }} ({{ value.status }}) {{ Number(value.investedHours).toFixed(3) }}/{{ value.pmHours }} - {{ value.name }} ({{ new Date(value.startTime).Format('yyyy-MM-dd') }})-({{ new Date(value.endTime).Format('yyyy-MM-dd') }})</q-item-section>
                </q-item>
            </q-list>
        </q-card-section>
    </q-card>
</template>

<script setup>
import { inject, computed, ref } from 'vue';
import { calculateBusinessDays, toPercent, delay, timeToDate, addMinutes } from 'app/spas/utils.js';
import { useQuasar } from 'quasar';

const sm = inject('spasManager');
const $q = useQuasar();

// 工作日狀態切換
function toggleWorkDay() {
    const actionText = sm.today.isWorkDay ? '設為休息日' : '設為工作日';
    const statusText = sm.today.isWorkDay ? '休息日' : '工作日';

    $q.dialog({
        title: '確認',
        message: `確定要將今天${actionText}嗎？`,
        cancel: true,
        persistent: true
    }).onOk(() => {
        sm.today.isWorkDay = !sm.today.isWorkDay;
        sm.jobRunner();
        $q.notify({
            message: `已將今天設為${statusText}`,
            color: 'positive',
            position: 'top',
            timeout: 1500
        });
    });
}

async function test() {
    console.log(sm.workItems);
}
</script>
