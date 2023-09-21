<template>
    <q-layout view="lHh Lpr lFf">
        <q-header elevated>
            <spasMenuBar />
        </q-header>

        <q-page-container>
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script setup>
import spasMenuBar from 'components/spasMenuBar.vue';
</script>
