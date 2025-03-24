<template>
    <q-bar class="q-electron-drag">
        <q-icon name="laptop_chromebook" />
        <div>ALMA - SPAS Assistant</div>

        <q-space />

        <!-- DevTools 切換按鈕，只在開發模式下顯示 -->
        <q-btn v-if="isDevelopment" dense flat :icon="isDevToolsOpen ? 'code_off' : 'code'" :color="isDevToolsOpen ? 'orange' : 'white'" @click="toggleDevTools" tooltip="切換開發工具" />
        <q-btn dense flat icon="minimize" @click="winAction('minimize')" />
        <q-btn dense flat icon="crop_square" @click="winAction('maximize')" />
        <q-btn dense flat icon="close" @click="winAction('close')" />
    </q-bar>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

// 判斷是否為開發模式
const isDevelopment = ref(process.env.NODE_ENV !== 'production');
const isDevToolsOpen = ref(false);

// 窗口操作函數
function winAction(a) {
    switch (a) {
        case 'minimize': {
            ALMA.minimize();
            break;
        }
        case 'maximize': {
            ALMA.maximize();
            break;
        }
        case 'close': {
            ALMA.close();
            break;
        }
        default: {
            break;
        }
    }
}

// 切換 DevTools
function toggleDevTools() {
    ALMA.toggleDevTools();
}

// 監聽 DevTools 狀態變化
async function updateDevToolsStatus() {
    if (isDevelopment.value) {
        isDevToolsOpen.value = await ALMA.isDevToolsOpen();
    }
}

// 初始化時獲取 DevTools 狀態
onMounted(async () => {
    await updateDevToolsStatus();

    // 定期檢查 DevTools 狀態
    const intervalId = setInterval(updateDevToolsStatus, 1000);

    onBeforeUnmount(() => {
        clearInterval(intervalId);
    });
});
</script>
