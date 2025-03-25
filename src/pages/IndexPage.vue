<template>
    <q-page class="column no-wrap">
        <!-- 狀態欄 - 靠上方 -->
        <div class="col-auto q-px-md q-pt-md">
            <spasStatus />
        </div>

        <!-- 工作項目表 - 填滿剩餘空間 -->
        <div class="col q-px-md q-py-sm" style="min-height: 0">
            <q-card class="full-height" flat bordered>
                <spasWorkItemTable />
            </q-card>
        </div>
    </q-page>

    <spasSignInDialog />
</template>

<script setup>
import { ref, reactive, inject } from 'vue';
import spasSignInDialog from 'src/components/spasSignInDialog.vue';
import spasStatus from 'src/components/spasStatus.vue';
import spasProjectTable from 'src/components/spasProjectTable.vue';
import spasWorkItemTable from 'src/components/spasWorkItemTable.vue';

//const sm = inject('spasManager');
</script>

<style lang="sass" scoped>
.q-page
  height: calc(100vh - 50px) // 減去頂部欄高度

.full-height
  height: 100%
  display: flex
  flex-direction: column

// 確保 WorkItemTable 自動填滿父容器
:deep(.full-height > .q-card__section)
  flex: 1
  overflow: auto
  display: flex
  flex-direction: column

</style>
