<template>
  <q-bar class="q-electron-drag">
    <q-icon name="laptop_chromebook" />
    <div>ALMA - SPAS Assistant</div>

    <q-space />

    <q-btn dense flat icon="minimize" @click="winAction('minimize')" />
    <q-btn dense flat icon="crop_square" @click="winAction('maximize')" />
    <q-btn dense flat icon="close" @click="winAction('close')" />
  </q-bar>
</template>

<script setup>
function winAction(a) {
  switch (a) {
    case "minimize": {
      ALMA.minimize();
      break;
    }
    case "maximize": {
      ALMA.maximize();
      break;
    }
    case "close": {
      ALMA.close();
      break;
    }
    default: {
      break;
    }
  }
}
</script>
