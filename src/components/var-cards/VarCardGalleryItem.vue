<script setup lang="ts">
import { computed } from "vue"
import { NButton, NCard, NTag, NThing } from "naive-ui"
import { useI18n } from "vue-i18n"

export interface VarCardGalleryCard {
  id: string
  title: string
  description: string
  icon?: string
  tags: string[]
  namespace: "builtin" | "user"
  readonly: boolean
  demoValue?: unknown
  previewContent: string
  recordType: string
  baseCardId?: string | null
}

const props = defineProps<{
  card: VarCardGalleryCard
}>()

const emit = defineEmits<{
  (e: "preview", card: VarCardGalleryCard): void
  (e: "clone", card: VarCardGalleryCard): void
  (e: "edit", card: VarCardGalleryCard): void
}>()

const { t } = useI18n()

const namespaceLabel = computed(() =>
  props.card.namespace === "builtin" ? t("varCards.badges.builtin") : t("varCards.badges.user")
)

const accentClass = computed(() =>
  props.card.namespace === "builtin" ? "gallery-item--builtin" : "gallery-item--user"
)

const actionLabel = computed(() =>
  props.card.readonly ? t("varCards.actions.clone") : t("common.edit")
)

function handlePrimaryAction() {
  if (props.card.readonly) {
    emit("clone", props.card)
    return
  }

  emit("edit", props.card)
}
</script>

<template>
  <NCard :class="['gallery-item', accentClass]" embedded hoverable>
    <div class="gallery-item__hero">
      <div class="gallery-item__icon-wrap">
        <span class="gallery-item__icon">{{ card.icon ?? "◧" }}</span>
      </div>

      <div class="gallery-item__meta">
        <div class="gallery-item__badges">
          <NTag size="small" round :bordered="false" :type="card.namespace === 'builtin' ? 'warning' : 'success'">
            {{ namespaceLabel }}
          </NTag>
          <NTag v-if="card.baseCardId" size="small" round :bordered="false">
            {{ t("varCards.badges.cloned") }}
          </NTag>
        </div>

        <NThing>
          <template #header>
            <div class="gallery-item__title-row">
              <span class="gallery-item__title">{{ card.title }}</span>
            </div>
          </template>
          <template #description>
            <span class="gallery-item__record-type">{{ card.recordType }}</span>
          </template>
        </NThing>
      </div>
    </div>

    <p class="gallery-item__description">{{ card.description }}</p>

    <div class="gallery-item__preview">
      <slot name="preview" />
    </div>

    <div class="gallery-item__tags">
      <span v-for="tag in card.tags" :key="tag" class="gallery-item__tag">{{ tag }}</span>
    </div>

    <div class="gallery-item__footer">
      <NButton quaternary @click="emit('preview', card)">
        {{ t("varCards.actions.preview") }}
      </NButton>
      <NButton type="primary" @click="handlePrimaryAction">
        {{ actionLabel }}
      </NButton>
    </div>
  </NCard>
</template>

<style scoped>
.gallery-item {
  height: 100%;
  border-radius: 22px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.82)),
    linear-gradient(180deg, rgba(247, 248, 250, 0.98), rgba(238, 242, 247, 0.98));
  backdrop-filter: blur(12px);
}

.gallery-item--builtin {
  box-shadow: 0 22px 40px rgba(15, 23, 42, 0.08);
}

.gallery-item--user {
  box-shadow: 0 24px 44px rgba(20, 83, 45, 0.12);
}

.gallery-item__hero {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
}

.gallery-item__icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(59, 130, 246, 0.8));
  color: #fff;
  flex-shrink: 0;
}

.gallery-item__icon {
  font-size: 22px;
  line-height: 1;
}

.gallery-item__meta {
  min-width: 0;
  flex: 1;
}

.gallery-item__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.gallery-item__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.gallery-item__title {
  font-size: 18px;
  font-weight: 700;
  color: #132238;
}

.gallery-item__record-type {
  font-family: "SFMono-Regular", "Menlo", monospace;
  font-size: 11px;
  color: rgba(19, 34, 56, 0.64);
}

.gallery-item__description {
  margin: 0 0 16px;
  color: rgba(19, 34, 56, 0.78);
  line-height: 1.5;
  min-height: 44px;
}

.gallery-item__preview {
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(245, 247, 250, 0.92));
  padding: 12px;
  min-height: 190px;
  overflow: hidden;
}

.gallery-item__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.gallery-item__tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: rgba(19, 34, 56, 0.7);
  font-size: 12px;
}

.gallery-item__footer {
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
</style>
