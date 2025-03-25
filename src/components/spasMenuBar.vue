<template>
    <q-bar class="q-electron-drag">
        <q-icon name="laptop_chromebook" />
        <div>ALMA - SPAS Assistant</div>

        <q-space />

        <!-- DevTools 切換按鈕，使用不同圖標和顏色顯示開啟/關閉狀態 -->
        <q-btn v-if="isDevelopment" dense flat :icon="sm.devModeView ? 'developer_board' : 'developer_board_off'" :color="sm.devModeView ? 'amber-8' : 'deep-orange-2'" @click="toggleDevMode" tooltip="切換開發模式" />
        <spasSettings />

        <q-btn dense flat icon="minimize" @click="winAction('minimize')" />
        <q-btn dense flat :icon="isMaximized ? 'filter_none' : 'crop_square'" @click="winAction('maximize')" />
        <q-btn dense flat icon="close" @click="winAction('close')" />
    </q-bar>
</template>

<script setup>
import { inject, ref, onMounted, onUnmounted } from 'vue';
import spasSettings from './spasSettings.vue';

// 判斷是否為開發模式
const isDevelopment = ref(process.env.NODE_ENV !== 'production');
const sm = inject('spasManager');
const isMaximized = ref(false);

// 監聽視窗最大化狀態
async function checkMaximizedState() {
    isMaximized.value = await ALMA.isMaximized();
}

// 監聽視窗狀態變化事件
function handleWindowStateChange() {
    checkMaximizedState();
}

// 組件掛載時，初始化視窗狀態並添加事件監聽器
onMounted(() => {
    checkMaximizedState();
    window.addEventListener('resize', handleWindowStateChange);
});

// 組件卸載時，移除事件監聽器
onUnmounted(() => {
    window.removeEventListener('resize', handleWindowStateChange);
});

// 窗口操作函數
function winAction(a) {
    switch (a) {
        case 'minimize': {
            ALMA.minimize();
            break;
        }
        case 'maximize': {
            ALMA.maximize();
            // 更新視窗狀態
            setTimeout(checkMaximizedState, 100);
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

// 切換開發模式
async function toggleDevMode() {
    // 僅切換 SpasManager 中的 devModeView 狀態
    SPAS.toggleDevModeView();
    sm.devModeView = !sm.devModeView;
}
</script>
