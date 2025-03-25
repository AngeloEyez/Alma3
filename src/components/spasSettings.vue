<template>
    <!-- 設定按鈕 -->
    <q-btn flat round icon="settings" color="white" @click="showSettingsDialog = true" tooltip="設定" />

    <!-- 設定對話框 -->
    <q-dialog v-model="showSettingsDialog" @show="loadSettings" @hide="resetSettings">
        <q-card style="min-width: 450px">
            <!-- 標題列 - 減小高度 -->
            <q-card-section class="row items-center bg-primary text-white q-py-xs">
                <q-icon name="settings" size="sm" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-bold">系統設定</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <!-- 內容區 - 雙欄佈局 -->
            <q-card-section class="q-pa-sm">
                <div class="row q-col-gutter-md">
                    <!-- 左欄 -->
                    <div class="col-12 col-sm-6">
                        <!-- 帳號資訊 -->
                        <div class="q-mb-sm">
                            <div class="text-subtitle2 text-weight-medium q-pb-xs">帳號資訊</div>
                            <q-separator />

                            <div class="q-pt-sm">
                                <q-input v-model="settings.workId" label="帳號" dense>
                                    <template v-slot:prepend>
                                        <q-icon name="person" />
                                    </template>
                                    <template v-slot:hint>
                                        <span class="text-grey-8 text-caption">SPAS 系統登入帳號</span>
                                    </template>
                                </q-input>
                            </div>

                            <div class="q-pt-xs">
                                <q-input v-model="settings.password" label="密碼" type="password" dense>
                                    <template v-slot:prepend>
                                        <q-icon name="lock" />
                                    </template>
                                    <template v-slot:hint>
                                        <span class="text-grey-8 text-caption">SPAS 系統登入密碼</span>
                                    </template>
                                </q-input>
                            </div>
                        </div>
                    </div>

                    <!-- 右欄 -->
                    <div class="col-12 col-sm-6">
                        <!-- 工作時間設定 -->
                        <div class="q-mb-sm">
                            <div class="text-subtitle2 text-weight-medium q-pb-xs">工作時間設定</div>
                            <q-separator />

                            <div class="q-pt-sm">
                                <q-input v-model="settings.workStartTime" label="預設上班時間" mask="##:##" dense>
                                    <template v-slot:prepend>
                                        <q-icon name="schedule" />
                                    </template>
                                    <template v-slot:hint>
                                        <span class="text-grey-8 text-caption">每日預設上班時間 (HH:MM)</span>
                                    </template>
                                </q-input>
                            </div>

                            <div class="q-pt-xs">
                                <q-input v-model="settings.workEndTime" label="預設下班時間" mask="##:##" dense>
                                    <template v-slot:prepend>
                                        <q-icon name="schedule" />
                                    </template>
                                    <template v-slot:hint>
                                        <span class="text-grey-8 text-caption">每日預設下班時間 (HH:MM)</span>
                                    </template>
                                </q-input>
                            </div>
                        </div>
                    </div>

                    <!-- 跨越兩欄的進階設定 -->
                    <div class="col-12">
                        <div class="text-subtitle2 text-weight-medium q-pb-xs">進階設定</div>
                        <q-separator />

                        <div class="q-pt-xs">
                            <q-item tag="label" dense class="q-px-none">
                                <q-item-section avatar style="min-width: 40px">
                                    <q-toggle v-model="settings.useSpasEndTime" color="primary" dense />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label>使用 SPAS 系統計算的下班時間</q-item-label>
                                    <q-item-label caption class="text-grey-8">啟用後，系統將優先使用 SPAS 系統自動計算的下班時間，而非預設下班時間</q-item-label>
                                </q-item-section>
                            </q-item>
                        </div>
                    </div>
                </div>
            </q-card-section>

            <!-- 底部按鈕 -->
            <q-card-actions align="right" class="bg-grey-2 q-py-xs">
                <q-btn label="取消" color="grey-7" v-close-popup no-caps dense />
                <q-btn label="儲存" color="primary" @click="saveSettings" v-close-popup no-caps dense />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { reactive, inject, ref } from 'vue';

const sm = inject('spasManager');

// 設定對話框顯示狀態
const showSettingsDialog = ref(false);

// 設定相關
const settings = reactive({
    workId: '',
    password: '',
    workStartTime: '',
    workEndTime: '',
    useSpasEndTime: false
});

// 原始設定值，用於重置
let originalSettings = {};

// 每次開啟設定對話框時，獲取最新設定
async function loadSettings() {
    // 執行 getSettings 獲取最新設定
    await sm.do('getSettings');

    // 從 spasManager 獲取設定值
    settings.workId = sm.s.signIn.workId;
    settings.password = sm.s.signIn.password;
    settings.workStartTime = sm.s.workStartTime;
    settings.workEndTime = sm.s.workEndTime;
    settings.useSpasEndTime = sm.s.useSpasEndTime;

    // 保存原始設定，用於取消時重置
    originalSettings = { ...settings };
}

// 當關閉對話框但未儲存時，重置為原始設定
function resetSettings() {
    Object.assign(settings, originalSettings);
}

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
