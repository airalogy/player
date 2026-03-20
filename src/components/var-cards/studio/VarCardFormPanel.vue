<script setup lang="ts">
import { computed } from "vue"
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NTag,
} from "naive-ui"

const props = defineProps<{
  draft: Record<string, any>
  readOnly: boolean
}>()

const emit = defineEmits<{
  (e: "update:draft", value: Record<string, any>): void
}>()

const layoutOptions = [
  { label: "Text", value: "text" },
  { label: "Textarea", value: "textarea" },
  { label: "Number", value: "number" },
  { label: "Boolean", value: "boolean" },
  { label: "Select", value: "select" },
  { label: "Code", value: "code" },
]

const tagSummary = computed(() =>
  String(props.draft.tagsText || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean),
)

function updateField(key: string, value: unknown) {
  emit("update:draft", {
    ...props.draft,
    [key]: value,
  })
}
</script>

<template>
  <NCard :title="draft.readOnly ? 'Card Manifest (Read-only)' : 'Card Manifest'" size="large">
    <template #header-extra>
      <NTag :type="readOnly ? 'warning' : 'success'" size="small" round>
        {{ readOnly ? "Built-in" : "User" }}
      </NTag>
    </template>

    <NForm label-placement="top">
      <div class="form-grid">
        <NFormItem label="Title">
          <NInput
            :value="draft.title"
            :disabled="readOnly"
            placeholder="PCR Buffer Snapshot"
            @update:value="updateField('title', $event)"
          />
        </NFormItem>

        <NFormItem label="Record Type">
          <NInput
            :value="draft.recordType"
            :disabled="readOnly"
            placeholder="card:user/pcr-buffer-snapshot"
            @update:value="updateField('recordType', $event)"
          />
        </NFormItem>
      </div>

      <NFormItem label="Description">
        <NInput
          type="textarea"
          :value="draft.description"
          :disabled="readOnly"
          :autosize="{ minRows: 2, maxRows: 4 }"
          placeholder="Short explanation shown in picker and market cards."
          @update:value="updateField('description', $event)"
        />
      </NFormItem>

      <div class="form-grid">
        <NFormItem label="Layout Kind">
          <NSelect
            :value="draft.layoutKind"
            :disabled="readOnly"
            :options="layoutOptions"
            @update:value="updateField('layoutKind', $event)"
          />
        </NFormItem>

        <NFormItem label="Tags">
          <NInput
            :value="draft.tagsText"
            :disabled="readOnly"
            placeholder="lab, timing, sample"
            @update:value="updateField('tagsText', $event)"
          />
        </NFormItem>
      </div>

      <div class="form-grid">
        <NFormItem label="Field Label">
          <NInput
            :value="draft.fieldLabel"
            :disabled="readOnly"
            placeholder="Buffer concentration"
            @update:value="updateField('fieldLabel', $event)"
          />
        </NFormItem>

        <NFormItem label="Placeholder">
          <NInput
            :value="draft.placeholder"
            :disabled="readOnly"
            placeholder="Enter a value"
            @update:value="updateField('placeholder', $event)"
          />
        </NFormItem>
      </div>

      <NFormItem label="Help Text">
        <NInput
          :value="draft.helpText"
          :disabled="readOnly"
          placeholder="Optional supporting hint below the field."
          @update:value="updateField('helpText', $event)"
        />
      </NFormItem>

      <NFormItem label="Enum Options">
        <NInput
          type="textarea"
          :value="draft.enumOptionsText"
          :disabled="readOnly || draft.layoutKind !== 'select'"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="low|Low&#10;medium|Medium&#10;high|High"
          @update:value="updateField('enumOptionsText', $event)"
        />
      </NFormItem>

      <NFormItem label="Demo Value">
        <NInput
          type="textarea"
          :value="draft.demoValueText"
          :disabled="readOnly"
          :autosize="{ minRows: 3, maxRows: 8 }"
          placeholder="Used by the live preview panel. JSON is supported."
          @update:value="updateField('demoValueText', $event)"
        />
      </NFormItem>
    </NForm>

    <div v-if="tagSummary.length" class="tag-list">
      <NTag v-for="tag in tagSummary" :key="tag" size="small" round>{{ tag }}</NTag>
    </div>
  </NCard>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
