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
        <q-input bottom-slots v-model="sm.signInDialog.verifyCode" label="Verify Code" dense autofocus @keyup.enter="signIn">
          <template v-slot:after>
            <img :src="'data:image/jpeg;base64,' + sm.signInDialog.img" @click="sm.needSignIn()" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <p class="text-negative" v-if="sm.signInDialog.msg.length">{{ sm.signInDialog.msg }}</p>
        <q-space />
        <q-btn round dense flat label="Sign In" icon="send" @click="signIn" />
      </q-card-actions>
      <q-inner-loading :showing="sm.signInDialog.isloading" label="Please wait..." label-class="text-teal" label-style="font-size: 1.1em" />
    </q-card>
  </q-dialog>
</template>

<script setup>
import { inject } from "vue";

const sm = inject("spasManager");

function signIn() {
  if (sm.signInDialog.verifyCode.length > 0 && sm.s.signIn.workId.length > 0 && sm.s.signIn.password.length > 0) sm.signIn();
}
</script>
