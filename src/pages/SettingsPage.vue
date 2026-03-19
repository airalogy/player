<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { NSelect, NCard, NForm, NFormItem } from "naive-ui"

const { t, locale } = useI18n()

const languageOptions = [
  { label: "English", value: "en" },
  { label: "中文", value: "zh" },
]

const currentLocale = ref(locale.value)

function onLocaleChange(value: string) {
  locale.value = value
}
</script>

<template>
  <div class="settings-page">
    <header class="page-header">
      <h1 class="page-title">{{ t("settings.title") }}</h1>
    </header>

    <main class="settings-content">
      <NCard title="General">
        <NForm>
          <NFormItem :label="t('settings.language')">
            <NSelect
              v-model:value="currentLocale"
              :options="languageOptions"
              @update:value="onLocaleChange"
              style="width: 200px"
            />
          </NFormItem>
        </NForm>
      </NCard>

      <NCard title="About" style="margin-top: 24px">
        <p><strong>AimdLab</strong> v1.0.0</p>
        <p style="margin-top: 8px; color: var(--aimd-text-secondary)">
          {{ t("app.description") }}
        </p>
      </NCard>
    </main>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: 100vh;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
}

.settings-content {
  background: var(--aimd-bg-card);
  border-radius: 12px;
  padding: 24px;
}
</style>
