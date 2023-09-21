<template>
    <router-view />
</template>

<script>
import { defineComponent } from 'vue';
import { ref, reactive, provide } from 'vue';
import { SpasManager } from 'app/spas/SpasManager';

// Alma: Create spasManager
const sm = reactive(new SpasManager());
SPAS.receive('toRenderer', (event, msg) => sm.do(event, msg));
provide('spasManager', sm);

export default defineComponent({
    name: 'App'
});
</script>
