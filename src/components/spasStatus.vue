<template>
    <q-card flat bordered>
        <q-card-section class="bg-grey-7 text-white q-py-xs">
            <div class="row no-wrap items-center q-gutter-x-md">
                <!-- 左欄：用戶 ID 和名稱 -->
                <div class="col-auto">
                    <div class="text-subtitle1 text-weight-medium">
                        {{ sm.s.signIn.workId }}
                        <span v-if="sm.s.signIn.userName" class="text-caption q-ml-xs">({{ sm.s.signIn.userName }})</span>
                    </div>
                </div>

                <q-separator vertical dark />

                <!-- 右欄：時間資訊 -->
                <div class="col row wrap q-gutter-x-md q-gutter-y-xs">
                    <!-- 第一行 -->
                    <div class="col-auto text-caption">
                        <q-icon name="login" size="xs" class="q-mr-xs" />
                        上班時間: {{ sm.today.clockInTime || '等待取得...' }}
                    </div>
                    <div class="col-auto text-caption">
                        <q-icon name="schedule" size="xs" class="q-mr-xs" />
                        SPAS自動暫停時間: {{ sm.today.desendTime || '等待取得...' }}
                    </div>

                    <!-- 第二行 -->
                    <div class="col-auto text-caption">
                        <q-icon name="access_time" size="xs" class="q-mr-xs" />
                        預設上班時間: {{ sm.s.workStartTime }}
                    </div>
                    <div class="col-auto text-caption">
                        <q-icon name="access_time" size="xs" class="q-mr-xs" />
                        預設下班時間: {{ sm.s.workEndTime }}
                    </div>
                    <div class="col-auto text-caption">
                        <q-icon name="exit_to_app" size="xs" class="q-mr-xs" />
                        今日Alma下班時間: {{ sm.today.endDate ? sm.today.endDate.Format('hh:mm') : '--:--' }}
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
                    <q-btn size="sm" color="grey-7" label="test" dense no-caps @click="test" />
                    <q-btn size="sm" color="grey-7" label="getWorkItemsFromSpas" dense no-caps @click="sm.getWorkItemsFromSpas()" />
                    <q-btn size="sm" color="grey-7" label="calWorkPlanByWorkItem" dense no-caps @click="sm.calWorkPlanByWorkItem(8, 3)" />
                    <q-btn size="sm" color="grey-7" label="approveItems" dense no-caps @click="sm.approveItems" />
                    <q-btn size="sm" color="grey-7" label="finishItems" dense no-caps @click="sm.finishItems" />
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
import { inject, computed } from 'vue';
import { calculateBusinessDays, toPercent, delay, timeToDate, addMinutes } from 'app/spas/utils.js';

const sm = inject('spasManager');

async function test() {
    // for (const i of sm.onGoingWorkItems) {
    //   let r = await i.extend();
    //   console.log(r);
    //   if (!r) {
    //     console.log("pasue:" + (await i.pause()));
    //   }
    // }
    console.log(sm.workItems);
}
</script>
