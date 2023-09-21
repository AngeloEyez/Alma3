<template>
    <q-page class="flex flex-center">
        <div class="q-my-sm">
            <q-card class="my-card q-mb-sm">
                <spasStatus />
            </q-card>

            <q-card class="my-card">
                <spasWorkItemTable />
            </q-card>

            <!-- <q-card class="my-card">
        <spasProjectTable />
      </q-card> -->
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
.my-card
  width: 100%
  max-width: 1300px
</style>
