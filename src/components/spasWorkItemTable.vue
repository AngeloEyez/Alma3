<template>
    <!-- <div>My component</div> -->
    <q-table flat bordered dense :rows="Array.from(sm.workItems.values())" :columns="columns" row-key="id" :pagination="initialPagination" binary-state-sort>
        <template v-slot:body="props">
            <q-tr
                :props="props"
                :class="{
                    spasOnGoing: props.row.status == 1,
                    spasOutOfDate: new Date(props.row.endTime) < new Date()
                }"
            >
                <q-td v-for="col in props.cols" :key="col.name" :props="props">
                    <template v-if="col.name === 'status'">
                        <q-icon size="xs" v-if="col.value === 1" name="play_arrow" color="positive" />
                        <q-icon size="xs" v-else-if="col.value === 2" name="pause" color="grey" />
                        <template v-else>{{ col.value }}</template>
                    </template>
                    <template v-else-if="col.name === 'targetHours'">
                        <span :class="{ 'text-weight-bold': col.value > 0 }">{{ col.value }}</span>
                    </template>
                    <template v-else>
                        {{ col.value }}
                    </template>
                </q-td>
            </q-tr>
        </template>
    </q-table>
</template>

<script setup>
import { ref, reactive, inject } from 'vue';
import { toPercent } from 'app/spas/utils.js';

const sm = inject('spasManager');
const rows = reactive(Array.from(sm.workItems.values()));
const columns = [
    { name: 'id', required: true, label: 'id', align: 'center', field: 'id', format: val => `${val}`, sortable: true },
    { name: 'name', align: 'left', label: 'WorkItem Name', field: 'name', sortable: true },
    { name: 'startTime', align: 'left', label: 'Start', field: 'startTime', sortable: true, format: (val, row) => new Date(val).Format('yyyy-MM-dd') },
    { name: 'endTime', align: 'left', label: 'End', field: 'endTime', sortable: true, format: (val, row) => new Date(val).Format('yyyy-MM-dd') },
    { name: 'invpmHours', label: 'inv/pm Hours', field: row => `${row.investedHours.toFixed(2)} / ${row.pmHours.toFixed(2)}`, sortable: true },
    { name: 'ratio', label: '百分比', field: row => toPercent(row.investedHours / row.pmHours), sortable: true },
    { name: 'status', label: 'status', field: 'status', sortable: true },
    { name: 'priorityScore', label: 'priorityScore', field: 'priorityScore', sortable: true, format: (val, row) => val.toFixed(4) },
    { name: 'targetHours', label: 'targetHours', field: 'targetHours', sortable: true, format: (val, row) => val.toFixed(2) }
];
const initialPagination = {
    sortBy: 'priorityScore',
    descending: true,
    page: 1,
    rowsPerPage: 8
};
</script>

<style lang="sass" scoped>
.spasDisabled
  color: $blue-grey-5
  //background-color: $blue-grey-2

.spasOnGoing
  background-color: $secondary

.spasOutOfDate
  color: $pink-13
</style>
