<template>
    <!-- <div>My component</div> -->
    <q-table flat bordered dense title="Work Items" :rows="Array.from(sm.workItems.values())" :columns="columns" row-key="id" :pagination="initialPagination" binary-state-sort>
        <template v-slot:body="props">
            <q-tr
                :props="props"
                :class="{
                    spasOnGoing: props.row.status == 1,
                    spasOutOfDate: new Date(props.row.endTime) < new Date()
                }"
            >
                <q-td v-for="col in props.cols" :key="col.name" :props="props">
                    {{ col.value }}
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
    { name: 'id', required: true, label: 'id', align: 'left', field: 'id', format: val => `${val}`, sortable: true },
    { name: 'name', align: 'center', label: 'WorkItem Name', field: 'name', sortable: true },
    { name: 'startTime', label: 'Start', field: 'startTime', sortable: true, format: (val, row) => new Date(val).Format('yyyy-MM-dd') },
    { name: 'endTime', label: 'End', field: 'endTime', sortable: true, format: (val, row) => new Date(val).Format('yyyy-MM-dd') },
    { name: 'pmHours', label: 'pmHours', field: 'pmHours', sortable: true, format: (val, row) => val.toFixed(2) },
    { name: 'investedHours', label: 'investedHours', field: 'investedHours', sortable: true, format: (val, row) => val.toFixed(2) },
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
  background-color: $teal-3

.spasOutOfDate
  color: $pink-13
</style>
