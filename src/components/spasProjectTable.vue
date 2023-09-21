<template>
  <q-table :rows="Array.from(sm.platforms.values())" :columns="columns" row-key="id" :pagination="initialPagination" selection="multiple" v-model:selected="selected" :selected-rows-label="getSelectedString">
    <template v-slot:header="props">
      <q-tr :props="props">
        <q-th auto-width><q-toggle v-model="selEn" icon="settings" @update:model-value="selected = []" /></q-th>
        <q-th v-for="col in props.cols" :key="col.name" :props="props">
          {{ col.label }}
        </q-th>
      </q-tr>
    </template>

    <template v-slot:body="props">
      <q-tr :props="props" :class="{ spasDisabled: props.row.disabled, spasOnGoing: props.row.status == 1 }" @click="props.expand = !props.expand">
        <q-td auto-width>
          <!-- <q-btn size="sm" color="accent" round dense @click="props.expand = !props.expand" :icon="props.expand ? 'remove' : 'add'" /> -->
          <q-checkbox v-if="selEn" v-model="props.selected" />
          <q-toggle v-else v-model="props.row.disabled" :true-value="false" :false-value="true" checked-icon="check" unchecked-icon="clear" @update:model-value="sm.updatePrjProp()" />
        </q-td>
        <!-- <q-td v-for="col in props.cols" :key="col.name" :props="props"> {{ col.value }}</q-td> -->
        <q-td>
          <p class="q-ml-none q-my-none text-weight-bold" :class="{ 'text-primary': !props.row.disabled }"><q-icon name="fa-solid fa-sitemap" :style="{ color: !props.row.disabled ? 'black' : '' }" /> {{ props.row.name }}</p>
          <p class="q-ml-none q-my-none q-py-none q-gutter-x-xs">
            <q-badge color="grey-5">{{ props.row.id }}</q-badge>
            <q-badge color="green" class="cursor-pointer" v-for="groupkey in props.row.simultaneousGroup" :key="groupkey" @click.stop="setSimultaneous_openDialog(groupkey)">{{ groupkey }}</q-badge>
          </p>
        </q-td>
        <q-td>{{ new Date(props.row.startTime).Format("yyyy-MM-dd") }}</q-td>
        <q-td>{{ new Date(props.row.endTime).Format("yyyy-MM-dd") }}</q-td>
        <q-td>{{ props.row.pmHours.toFixed(1) }}</q-td>
        <q-td>{{ props.row.investedHours.toFixed(2) }}</q-td>
        <q-td>{{ props.row.todayTargetHours.toFixed(2) }}</q-td>
        <q-td>{{ props.row.maxRatio.toFixed(2) }}</q-td>
      </q-tr>
      <q-tr v-show="props.expand" v-for="item in Array.from(props.row.workItems.values())" :key="item.id" :props="props" :class="{ spasDisabled: props.row.disabled, spasOnGoing: item.status == 1 }">
        <q-td></q-td>
        <q-td>
          <p class="q-my-none q-pl-md">
            <q-icon name="fa-solid fa-drumstick-bite" :style="{ color: !props.row.disabled ? 'black' : '' }" />
            {{ item.name }}
            <q-badge color="grey-5">{{ item.id }}</q-badge>
          </p>
        </q-td>
        <q-td>{{ new Date(item.startTime).Format("yyyy-MM-dd") }}</q-td>
        <q-td>{{ new Date(item.endTime).Format("yyyy-MM-dd") }}</q-td>
        <q-td>{{ item.pmHours.toFixed(1) }}</q-td>
        <q-td>{{ item.investedHours.toFixed(2) }}</q-td>
        <q-td>-</q-td>
        <q-td>-</q-td>
      </q-tr>
    </template>

    <template v-if="selEn" v-slot:top-row>
      <q-tr>
        <q-td></q-td>
        <q-td colspan="100%"> <q-btn push color="primary" label="Set Simultaneous" size="sm" @click="setSimultaneous_openDialog()" /> </q-td>
      </q-tr>

      <q-dialog v-model="simultaneous.show" persistent>
        <q-card>
          <q-toolbar class="bg-primary text-white">
            <q-avatar icon="fas fa-sync" color="primary" text-color="white" /> <q-toolbar-title>Set <span class="text-weight-bold">Simultaneous</span> Projects</q-toolbar-title>
          </q-toolbar>

          <q-card-section class="column items-left">
            <span v-if="simultaneous.isAddMode">Add following projects to simultaneous group.</span>
            <span v-else
              >Modify <q-badge color="green">{{ simultaneous.groupName }}</q-badge> group to ...</span
            >
            <q-list bordered separator>
              <q-item v-for="p in selected" :key="p">
                <q-item-section avatar>
                  <q-icon name="remove_circle_outline" color="red" @click="setSimultaneous_removeItem(p.id)" />
                </q-item-section>
                <q-item-section class="text-weight-bold text-primary q-ml-none">
                  <div><q-icon name="fa-solid fa-sitemap" style="color: black" class="q-mr-sm" /> {{ p.name }}</div>
                </q-item-section>
              </q-item>
              <q-item v-if="selected.length == 0"> Remove all projects from this group.</q-item>
            </q-list>
          </q-card-section>

          <q-card-actions>
            <!-- <q-input dense v-model="simultaneous.groupName" label="Name this group" autofocus /> -->
            <q-select v-if="simultaneous.isAddMode" dense outlined use-input input-debounce="0" hide-selected fill-input label="Name this group" v-model="simultaneous.groupName" :options="simultaneous.groupOptions" @filter="setSimultaneousfilter" autofocus />
            <q-space />
            <q-btn dense label="Cancel" color="primary" v-close-popup />
            <q-btn dense label="Set" color="primary" :disable="!simultaneous.groupName.length" v-close-popup @click="setSimultaneous" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </template>
  </q-table>
</template>


<script setup>
import { ref, reactive, inject } from "vue";
import { toPercent } from "app/spas/utils.js";

const sm = inject("spasManager");

const selected = ref([]);
const selEn = ref(false);
const simultaneous = reactive({
  show: false,
  isAddMode: true,
  groupName: "",
  groupOptions: sm.simultaneousGroups,
});

function getSelectedString(numberOfRows) {
  return `${numberOfRows} project${numberOfRows > 1 ? "s" : ""} selected.`;
}

function setSimultaneousfilter(val, update, abort) {
  update(() => {
    simultaneous.groupName = val;
    const needle = val.toLowerCase();
    simultaneous.groupOptions = sm.simultaneousGroups.filter((v) => v.toLowerCase().indexOf(needle) > -1);
  });
}
function setSimultaneous() {
  let ids = Array.from(selected.value, (p) => p.id);
  sm.setSimultaneousProjects(simultaneous.groupName, ids, simultaneous.isAddMode);

  selected.value = [];
  simultaneous.isAddMode = true;
  simultaneous.groupName = "";
  simultaneous.show = false;
  selEn.value = false;
}

function setSimultaneous_removeItem(pid) {
  selected.value = selected.value.filter((v) => {
    return v.id != pid;
  });
  if (simultaneous.isAddMode && selected.value.length < 2) simultaneous.show = false;
}

function setSimultaneous_openDialog(group = null) {
  simultaneous.isAddMode = group == null ? true : false;
  if (group != null) {
    selEn.value = true;
    selected.value = Array.from(sm.platforms.values()).filter((row) => row.simultaneousGroup.includes(group));
    simultaneous.groupName = group;
  }
  simultaneous.show = true;
}

const initialPagination = {
  sortBy: "todayTargetHours",
  descending: true,
  page: 1,
  rowsPerPage: 8,
};

const columns = [
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left",
    //style: "width:100px, whiteSpace: 'normal'",
    //headerStyle: "width: 100px",
    sortable: true,
  },
  {
    name: "startTime",
    label: "Start",
    field: "startTime",
    align: "left",
    format: (val, row) => {
      return new Date(val).Format("yyyy-MM-dd");
    },
    sortable: true,
  },
  {
    name: "endTime",
    label: "End",
    field: "endTime",
    align: "left",
    format: (val, row) => {
      return new Date(val).Format("yyyy-MM-dd");
    },
  },
  {
    name: "pmHours",
    label: "pmHours",
    field: "pmHours",
    align: "left",
    format: (val, row) => {
      return val.toFixed(1);
    },
  },
  {
    name: "investedHours",
    label: "investedHours",
    field: "investedHours",
    align: "left",
    format: (val, row) => {
      return val.toFixed(2);
    },
  },
  {
    name: "todayTargetHours",
    label: "TargetHours",
    field: "todayTargetHours",
    align: "left",
    format: (val, row) => {
      return val.toFixed(3);
    },
    sortable: true,
  },
  {
    name: "maxRatio",
    label: "maxRatio",
    field: "maxRatio",
    align: "left",
    format: (val, row) => {
      return toPercent(val);
    },
    sortable: true,
  },
];
</script>

<style lang="sass" scoped>
.spasDisabled
  color: $blue-grey-5
  //background-color: $blue-grey-2

.spasOnGoing
  background-color: $light-green-2
</style>
