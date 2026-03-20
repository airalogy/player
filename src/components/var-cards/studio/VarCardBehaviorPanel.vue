<script setup lang="ts">
import {
  NAlert,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSwitch,
} from "naive-ui"

const props = defineProps<{
  draft: Record<string, any>
  readOnly: boolean
}>()

const emit = defineEmits<{
  (e: "update:draft", value: Record<string, any>): void
}>()

function updateField(key: string, value: unknown) {
  emit("update:draft", {
    ...props.draft,
    [key]: value,
  })
}
</script>

<template>
  <NCard title="Behavior" size="large">
    <NAlert v-if="readOnly" type="warning" :show-icon="false" class="clone-alert">
      Built-in cards are locked. Clone this card to customize labels, validation hints, and preview data.
    </NAlert>

    <NForm label-placement="top">
      <div class="switch-grid">
        <NFormItem label="Required">
          <NSwitch
            :value="!!draft.required"
            :disabled="readOnly"
            @update:value="updateField('required', $event)"
          />
        </NFormItem>

        <NFormItem label="Read-only Runtime">
          <NSwitch
            :value="!!draft.readonlyBehavior"
            :disabled="readOnly"
            @update:value="updateField('readonlyBehavior', $event)"
          />
        </NFormItem>
      </div>

      <NFormItem label="Validation Hint">
        <NInput
          :value="draft.validationHint"
          :disabled="readOnly"
          placeholder="Shown when a value is invalid or missing."
          @update:value="updateField('validationHint', $event)"
        />
      </NFormItem>

      <NFormItem label="Empty State">
        <NInput
          :value="draft.emptyState"
          :disabled="readOnly"
          placeholder="Preview message when there is no value yet."
          @update:value="updateField('emptyState', $event)"
        />
      </NFormItem>
    </NForm>
  </NCard>
</template>

<style scoped>
.clone-alert {
  margin-bottom: 16px;
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 720px) {
  .switch-grid {
    grid-template-columns: 1fr;
  }
}
</style>
