<template>
    <q-card>
        <q-card-section horizontal class="bg-grey-7 text-white">
            <q-card-section class="q-pt-xs">
                <q-item>
                    <q-item-section>
                        <q-item-label>
                            <b>{{ sm.s.signIn.workId }}</b>
                            <span v-if="sm.s.signIn.userName">({{ sm.s.signIn.userName }})</span>
                        </q-item-label>
                        <q-item-label caption class="text-white">上班時間: {{ sm.today.clockInTime || '等待取得...' }}</q-item-label>
                        <q-item-label caption class="text-white">SPAS自動暫停時間: {{ sm.today.desendTime || '等待取得...' }}</q-item-label>
                        <q-item-label caption class="text-white">預設上班時間: {{ sm.s.workStartTime }}</q-item-label>
                        <q-item-label caption class="text-white">預設下班時間: {{ sm.s.workEndTime }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-card-section>
            <q-space />
            <q-card-section class="q-pt-xs" v-if="sm.devModeView">
                <q-input v-model="sm.today.schedule2" label="today.schedule2" />
                <button @click="test">test</button>
                <button @click="sm.getWorkItemsFromSpas()">getWorkItemsFromSpas</button>
                <button @click="sm.calWorkPlanByWorkItem(8, 3)">calWorkPlanByWorkItem</button>
                <button @click="sm.approveItems">approveItems</button>
                <button @click="sm.finishItems">finishItems</button>
            </q-card-section>
            <q-card-actions vertical class="justify-start">
                <spasSettings />
            </q-card-actions>
        </q-card-section>
        <!-- <q-card-section class="row">
            <q-item>
                <q-item-section v-for="(value, key) in sm.onGoingWorkItems3" :key="key">{{ key }}: {{ value.id }} ({{ value.status }}) {{ Number(value.investedHours).toFixed(3) }}/{{ value.pmHours }} - {{ value.name }} ({{ new Date(value.startTime).Format('yyyy-MM-dd') }})-({{ new Date(value.endTime).Format('yyyy-MM-dd') }})</q-item-section>
            </q-item>
        </q-card-section> -->
    </q-card>
</template>

<script setup>
import { inject } from 'vue';
import { calculateBusinessDays, toPercent, delay, timeToDate, addMinutes } from 'app/spas/utils.js';
import spasSettings from './spasSettings.vue';

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
