<script lang="ts">
import { computed, defineComponent } from "vue"

export default defineComponent({
  name: "VarCardShell",
  props: {
    fieldId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    cardTitle: {
      type: String,
      default: "",
    },
    accentColor: {
      type: String,
      default: "",
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    classes: {
      type: Array as () => string[],
      default: () => [],
    },
  },
  setup(props) {
    const style = computed(() => {
      if (!props.accentColor) {
        return undefined
      }

      return {
        "--var-card-accent": props.accentColor,
      }
    })

    return {
      style,
    }
  },
})
</script>

<template>
  <span
    class="aimd-rec-inline aimd-rec-inline--var-stacked aimd-field-wrapper aimd-field-wrapper--inline var-card-shell"
    :class="classes"
    :style="style"
  >
    <span class="aimd-field aimd-field--no-style aimd-field__label">
      <span class="aimd-field__scope aimd-field__scope--var">var</span>
      <span class="aimd-field__id">{{ fieldId }}</span>
    </span>
    <span class="var-card-shell__chrome">
      <span class="var-card-shell__header">
        <span class="var-card-shell__heading">
          <span class="var-card-shell__title">{{ title }}</span>
          <span v-if="cardTitle && cardTitle !== title" class="var-card-shell__chip">{{ cardTitle }}</span>
        </span>
        <span v-if="readonly" class="var-card-shell__readonly">Read only</span>
      </span>
      <span v-if="description" class="var-card-shell__description">{{ description }}</span>
      <span class="var-card-shell__body">
        <slot />
      </span>
    </span>
  </span>
</template>

<style scoped>
.var-card-shell {
  width: 100%;
  min-width: min(100%, 360px);
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.var-card-shell__chrome {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--var-card-accent, var(--aimd-border-color)) 32%, var(--aimd-border-color));
  border-radius: 12px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--var-card-accent, #2f855a) 10%, white), white 72%);
}

.var-card-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.var-card-shell__heading {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.var-card-shell__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--aimd-text-primary);
}

.var-card-shell__chip {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--var-card-accent, #2f855a) 15%, white);
  color: color-mix(in srgb, var(--var-card-accent, #2f855a) 72%, black);
  font-size: 11px;
  font-weight: 600;
}

.var-card-shell__readonly {
  font-size: 11px;
  color: var(--aimd-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.var-card-shell__description {
  font-size: 12px;
  line-height: 1.45;
  color: var(--aimd-text-secondary);
}

.var-card-shell__body {
  display: block;
}

.var-card-shell :deep(.var-card-shell__input),
.var-card-shell :deep(.var-card-shell__select),
.var-card-shell :deep(.var-card-shell__textarea) {
  width: 100%;
  min-height: 38px;
  border: 1px solid var(--aimd-border-color);
  border-radius: 10px;
  padding: 8px 10px;
  background: white;
  color: var(--aimd-text-primary);
  font: inherit;
}

.var-card-shell :deep(.var-card-shell__textarea) {
  resize: vertical;
  min-height: 96px;
}

.var-card-shell :deep(.var-card-shell__textarea--single-line) {
  min-height: 38px;
}

.var-card-shell :deep(.var-card-shell__checkbox) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
}

.var-card-shell :deep(.var-card-shell__checkbox-label) {
  font-size: 13px;
  color: var(--aimd-text-primary);
}
</style>
