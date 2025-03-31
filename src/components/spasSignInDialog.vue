<template>
    <q-dialog v-model="sm.signInDialog.showDialog" persistent>
        <q-card style="min-width: 350px" class="relative-position">
            <q-card-section>
                <div class="text-h6">Sign In SPAS</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
                <q-input dense label="User Id" v-model="sm.s.signIn.workId" />
            </q-card-section>

            <q-card-section class="q-pt-none">
                <q-input dense label="Password" v-model="sm.s.signIn.password" />
            </q-card-section>

            <q-card-section class="q-pt-none">
                <q-input bottom-slots v-model="sm.signInDialog.verifyCode" label="Verify Code" dense autofocus @keyup.enter="signIn" @focus="stopCountdown">
                    <template v-slot:after>
                        <img :src="'data:image/jpeg;base64,' + sm.signInDialog.img" @click="sm.needSignIn()" />
                    </template>
                </q-input>
            </q-card-section>

            <q-card-section class="q-pt-none row items-center">
                <div class="col">
                    <span v-if="countdown > 0" class="text-subtitle2">{{ countdown }} 秒後自動登入...</span>
                </div>
                <div class="col-auto" style="display: flex; align-items: center">
                    <p class="text-negative q-mb-none q-mr-md" v-if="sm.signInDialog.msg.length">{{ sm.signInDialog.msg }}</p>
                    <q-btn round dense flat label="Sign In" icon="send" color="primary" @click="signIn" />
                </div>
            </q-card-section>

            <q-inner-loading :showing="sm.signInDialog.isloading" label="Please wait..." label-class="text-teal" label-style="font-size: 1.1em" />
        </q-card>
    </q-dialog>
</template>

<script setup>
import { inject, ref, watch, onUnmounted } from 'vue';

const sm = inject('spasManager');
const countdown = ref(0);
let timer = null;

// 停止倒計時
function stopCountdown() {
    if (timer) {
        clearInterval(timer);
        timer = null;
        countdown.value = 0;
    }
}

// 監視對話框和驗證碼
watch(
    () => [sm.signInDialog.showDialog, sm.signInDialog.verifyCode, sm.s.signIn.workId, sm.s.signIn.password],
    ([showDialog, verifyCode, workId, password]) => {
        // 清除現有的計時器
        stopCountdown();

        // 當對話框顯示且驗證碼長度為4時，且用戶名和密碼不為空時，開始倒計時
        if (showDialog && verifyCode && verifyCode.length === 4 && workId && workId.length > 0 && password && password.length > 0) {
            countdown.value = 5;

            timer = setInterval(() => {
                countdown.value--;

                // 倒計時結束，執行登入
                if (countdown.value <= 0) {
                    clearInterval(timer);
                    timer = null;
                    signIn();
                }
            }, 1000);
        }
    },
    { immediate: true }
);

// 組件卸載時清理計時器
onUnmounted(() => {
    stopCountdown();
});

function signIn() {
    if (sm.signInDialog.verifyCode.length > 0 && sm.s.signIn.workId.length > 0 && sm.s.signIn.password.length > 0) sm.signIn();
}
</script>
