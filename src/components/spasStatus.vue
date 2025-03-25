<template>
    <q-card flat bordered>
        <q-card-section class="bg-light-blue-8 text-white q-py-xs">
            <div class="row no-wrap items-center q-gutter-x-md">

                <div class="col row wrap q-gutter-x-md q-gutter-y-xs">
                    <!-- 第一行 -->
                    <div class="col-auto text-caption">
                        <q-icon name="login" size="xs" class="q-mr-xs" />
                        上班: {{ sm.today.clockInTime || '--:--' }}
                    </div>
                    <div class="col-auto text-caption">
                        <q-icon name="schedule" size="xs" class="q-mr-xs" />
                        SPAS自動暫停: {{ sm.today.desendTime || '--:--' }}
                    </div>

                    <!-- 第二行 -->
                    <div class="col-auto text-caption">
                        <q-icon name="access_time" size="xs" class="q-mr-xs" />
                        預設上班: {{ sm.s.workStartTime }}
                    </div>
                    <div class="col-auto text-caption">
                        <q-icon name="access_time" size="xs" class="q-mr-xs" />
                        預設下班: {{ sm.s.workEndTime }}
                    </div>
                    <div class="col-auto text-caption">
                        <q-icon name="exit_to_app" size="xs" class="q-mr-xs" />
                        今日Alma下班: {{ sm.today.endDate ? sm.today.endDate.Format('hh:mm') : '--:--' }}
                    </div>
                    <div class="col-auto text-caption q-ml-auto">
                        <q-icon name="favorite" size="xs" class="q-mr-xs" />
                        {{ sm._lastRunTime ? new Date(sm._lastRunTime).Format('hh:mm:ss') : '--:--' }}
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
