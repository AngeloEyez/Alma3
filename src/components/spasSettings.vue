<template>
    <!-- 設定按鈕 -->
    <q-btn flat round icon="settings" color="white" @click="showSettingsDialog = true" tooltip="設定" />

    <!-- 設定對話框 -->
    <q-dialog v-model="showSettingsDialog">
        <q-card style="min-width: 350px">
            <q-card-section class="row items-center">
                <div class="text-h6">使用者設定</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section>
                <q-input v-model="settings.workId" label="帳號" />
                <q-input v-model="settings.password" label="密碼" type="password" />
                <q-input v-model="settings.workStartTime" label="預設上班時間 (HH:MM)" mask="##:##" />
                <q-input v-model="settings.workEndTime" label="預設下班時間 (HH:MM)" mask="##:##" />
                <q-toggle v-model="settings.useSpasEndTime" label="使用 SPAS 下班時間" />
            </q-card-section>

            <q-card-actions align="right">
                <q-btn label="取消" color="negative" v-close-popup />
                <q-btn label="儲存" color="primary" @click="saveSettings" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, reactive, inject, onMounted } from 'vue';

const sm = inject('spasManager');

// 設定相關
const showSettingsDialog = ref(false);
const settings = reactive({
    workId: '',
    password: '',
    workStartTime: '',
    workEndTime: '',
    useSpasEndTime: false
});

// 初始化設定值
onMounted(() => {
    // 從 spasManager 獲取設定值
    settings.workId = sm.s.signIn.workId;
    settings.password = sm.s.signIn.password;
    settings.workStartTime = sm.s.workStartTime;
    settings.workEndTime = sm.s.workEndTime;
    settings.useSpasEndTime = sm.s.useSpasEndTime;
});

// 儲存設定
async function saveSettings() {
    // 檢查是否修改了帳號或密碼
    const isCredentialsChanged = settings.workId !== sm.s.signIn.workId || settings.password !== sm.s.signIn.password;

    // 更新設定
    await SPAS.set('signIn.workId', settings.workId);
    await SPAS.set('signIn.password', settings.password);
    await SPAS.set('workStartTime', settings.workStartTime);
    await SPAS.set('workEndTime', settings.workEndTime);
    await SPAS.set('useSpasEndTime', settings.useSpasEndTime);

    // 更新 spasManager 中的設定
    sm.s.signIn.workId = settings.workId;
    sm.s.signIn.password = settings.password;
    sm.s.workStartTime = settings.workStartTime;
    sm.s.workEndTime = settings.workEndTime;
    sm.s.useSpasEndTime = settings.useSpasEndTime;

    // 如果帳號或密碼變更，重新登入以獲取新 token
    if (isCredentialsChanged) {
        // 清除舊的 token
        await SPAS.set('token', '');
        sm.s.token = '';

        // 重新登入
        await SPAS.do('logOut');
        SPAS.do('signIn');
    }
}
</script>
