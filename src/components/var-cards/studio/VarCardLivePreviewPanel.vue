<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue"
import { NCard, NCode, NEmpty, NTag } from "naive-ui"

const props = defineProps<{
  draft: Record<string, any>
  readOnly: boolean
}>()

const previewSurfaceLoaders = import.meta.glob("../VarCardPreviewSurface.vue")
const previewSurfaceLoader = previewSurfaceLoaders["../VarCardPreviewSurface.vue"]
const PreviewSurface = previewSurfaceLoader
  ? defineAsyncComponent(previewSurfaceLoader as Parameters<typeof defineAsyncComponent>[0])
  : null

const options = computed(() =>
  String(props.draft.enumOptionsText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, label] = line.split("|").map((item) => item.trim())
      return {
        value: value || label,
        label: label || value,
      }
    }),
)

const parsedDemoValue = computed(() => {
  const raw = String(props.draft.demoValueText || "").trim()
  if (!raw) return ""

  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
})

const formattedDemoValue = computed(() =>
  typeof parsedDemoValue.value === "string"
    ? parsedDemoValue.value
    : JSON.stringify(parsedDemoValue.value, null, 2),
)
</script>

<template>
  <div class="preview-stack">
    <NCard title="Live Preview" size="large">
      <template #header-extra>
        <NTag size="small" round :type="readOnly ? 'warning' : 'default'">
          {{ draft.layoutKind }}
        </NTag>
      </template>

      <component
        :is="PreviewSurface"
        v-if="PreviewSurface"
        :card="draft"
        :value="parsedDemoValue"
      />

      <div v-else class="preview-surface">
        <label class="preview-label">{{ draft.fieldLabel || draft.title || "Untitled card" }}</label>

        <div v-if="draft.layoutKind === 'boolean'" class="preview-toggle">
          <span>{{ parsedDemoValue ? "Enabled" : "Disabled" }}</span>
        </div>

        <select v-else-if="draft.layoutKind === 'select'" class="preview-input" disabled>
          <option v-for="option in options" :key="option.value" :selected="option.value === parsedDemoValue">
            {{ option.label }}
          </option>
        </select>

        <textarea
          v-else-if="draft.layoutKind === 'textarea' || draft.layoutKind === 'code'"
          class="preview-input preview-textarea"
          :value="formattedDemoValue"
          disabled
        />

        <input
          v-else
          class="preview-input"
          :value="formattedDemoValue"
          :placeholder="draft.placeholder || draft.emptyState || ''"
          disabled
        />

        <p v-if="draft.helpText" class="preview-help">{{ draft.helpText }}</p>
        <p v-if="draft.validationHint" class="preview-validation">{{ draft.validationHint }}</p>
      </div>
    </NCard>

    <NCard title="Compiled Snapshot" size="small">
      <NEmpty v-if="!formattedDemoValue" description="No demo value configured yet." />
      <NCode v-else :code="formattedDemoValue" language="json" word-wrap />
    </NCard>
  </div>
</template>

<style scoped>
.preview-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-surface {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 42%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(255, 255, 255, 0.92));
}

.preview-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #0f172a;
}

.preview-input {
  width: 100%;
  min-height: 44px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  padding: 11px 14px;
  color: #0f172a;
}

.preview-textarea {
  min-height: 120px;
  resize: none;
}

.preview-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.12);
  color: #0369a1;
  font-weight: 600;
}

.preview-help,
.preview-validation {
  margin: 0;
  font-size: 12px;
}

.preview-help {
  color: #475569;
}

.preview-validation {
  color: #b45309;
}
</style>
