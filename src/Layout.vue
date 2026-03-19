<script setup lang="ts">
import { NMessageProvider, NDialogProvider, NNotificationProvider } from "naive-ui"
</script>

<template>
  <NNotificationProvider>
    <NDialogProvider>
      <NMessageProvider>
        <router-view />
      </NMessageProvider>
    </NDialogProvider>
  </NNotificationProvider>
</template>
