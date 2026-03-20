<script setup lang="ts">
import { computed, onMounted, ref, unref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import {
  NAlert,
  NButton,
  NEmpty,
  NSpace,
  NSpin,
  useMessage,
} from "naive-ui"
import VarCardStudioLayout from "@/components/var-cards/studio/VarCardStudioLayout.vue"
import VarCardFormPanel from "@/components/var-cards/studio/VarCardFormPanel.vue"
import VarCardBehaviorPanel from "@/components/var-cards/studio/VarCardBehaviorPanel.vue"
import VarCardLivePreviewPanel from "@/components/var-cards/studio/VarCardLivePreviewPanel.vue"

type StudioStatus = "loading" | "ready" | "missing-store" | "missing-card"

type VarCardRecord = Record<string, any>

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const message = useMessage()

const status = ref<StudioStatus>("loading")
const store = ref<Record<string, any> | null>(null)
const cards = ref<VarCardRecord[]>([])
const sourceManifest = ref<VarCardRecord | null>(null)
const draft = ref(createEmptyDraft())
const saving = ref(false)
const cloning = ref(false)

const storeLoaders = import.meta.glob("../stores/varCards.ts")

const currentCardId = computed(() => {
  const value = route.query.id
  return typeof value === "string" ? value : ""
})

const currentRecordType = computed(() => {
  const value = route.query.recordType
  return typeof value === "string" ? value : ""
})

const isReadOnly = computed(() =>
  Boolean(draft.value.readOnly || draft.value.namespace === "builtin"),
)

const pageTitle = computed(() =>
  draft.value.title || t("varCards.studio.title"),
)

const pageSubtitle = computed(() =>
  isReadOnly.value
    ? t("varCards.studio.readOnlyDescription")
    : t("varCards.studio.description"),
)

function createEmptyDraft() {
  return {
    id: "",
    namespace: "user",
    title: "",
    description: "",
    recordType: "",
    version: "1.0.0",
    tagsText: "",
    layoutKind: "text",
    fieldLabel: "",
    placeholder: "",
    helpText: "",
    enumOptionsText: "",
    demoValueText: "",
    required: false,
    readonlyBehavior: false,
    validationHint: "",
    emptyState: "",
    readOnly: false,
  }
}

function parseDemoValueText(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed) return ""

  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function optionsTextFromManifest(manifest: VarCardRecord): string {
  const options = manifest.schema?.options
  if (!Array.isArray(options)) return ""

  return options
    .map((option: any) => {
      if (typeof option === "string") return option
      const value = String(option?.value ?? option?.key ?? option?.label ?? "").trim()
      const label = String(option?.label ?? option?.text ?? value).trim()
      return value && label ? `${value}|${label}` : value || label
    })
    .filter(Boolean)
    .join("\n")
}

function draftFromManifest(manifest: VarCardRecord) {
  return {
    id: String(manifest.id || ""),
    namespace: String(manifest.namespace || "user"),
    title: String(manifest.title || ""),
    description: String(manifest.description || ""),
    recordType: String(manifest.recordType || ""),
    version: String(manifest.version || "1.0.0"),
    tagsText: Array.isArray(manifest.tags) ? manifest.tags.join(", ") : "",
    layoutKind: String(manifest.layout?.kind || manifest.schema?.kind || "text"),
    fieldLabel: String(manifest.schema?.label || manifest.layout?.label || manifest.title || ""),
    placeholder: String(manifest.schema?.placeholder || manifest.layout?.placeholder || ""),
    helpText: String(manifest.schema?.helpText || manifest.behavior?.helpText || ""),
    enumOptionsText: optionsTextFromManifest(manifest),
    demoValueText:
      typeof manifest.demoValue === "string"
        ? manifest.demoValue
        : JSON.stringify(manifest.demoValue ?? "", null, 2),
    required: Boolean(manifest.behavior?.required),
    readonlyBehavior: Boolean(manifest.behavior?.readonly),
    validationHint: String(manifest.behavior?.validationHint || ""),
    emptyState: String(manifest.behavior?.emptyState || ""),
    readOnly: Boolean(manifest.readonly || manifest.namespace === "builtin"),
  }
}

function parseOptions(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, label] = line.split("|").map((item) => item.trim())
      return {
        value: value || label,
        label: label || value,
      }
    })
}

function buildManifestFromDraft(nextDraft: Record<string, any>, baseManifest: VarCardRecord | null) {
  const manifest: VarCardRecord = structuredClone(baseManifest ?? {})
  const namespace = String(nextDraft.namespace || baseManifest?.namespace || "user")
  const isBuiltIn = namespace === "builtin"

  manifest.id = nextDraft.id || baseManifest?.id || ""
  manifest.namespace = namespace
  manifest.version = nextDraft.version || baseManifest?.version || "1.0.0"
  manifest.title = String(nextDraft.title || "").trim()
  manifest.description = String(nextDraft.description || "").trim()
  manifest.recordType = String(nextDraft.recordType || "").trim()
  manifest.readonly = isBuiltIn ? true : Boolean(nextDraft.readOnly)
  manifest.tags = String(nextDraft.tagsText || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
  manifest.demoValue = parseDemoValueText(String(nextDraft.demoValueText || ""))

  manifest.layout = {
    ...(manifest.layout ?? {}),
    kind: nextDraft.layoutKind || "text",
    label: nextDraft.fieldLabel || manifest.title,
    placeholder: nextDraft.placeholder || "",
  }

  manifest.schema = {
    ...(manifest.schema ?? {}),
    kind: nextDraft.layoutKind || "text",
    label: nextDraft.fieldLabel || manifest.title,
    placeholder: nextDraft.placeholder || "",
    helpText: nextDraft.helpText || "",
    options: parseOptions(String(nextDraft.enumOptionsText || "")),
  }

  manifest.behavior = {
    ...(manifest.behavior ?? {}),
    required: Boolean(nextDraft.required),
    readonly: Boolean(nextDraft.readonlyBehavior),
    validationHint: String(nextDraft.validationHint || ""),
    emptyState: String(nextDraft.emptyState || ""),
    helpText: String(nextDraft.helpText || ""),
  }

  return manifest
}

function updateDraft(value: Record<string, any>) {
  draft.value = {
    ...draft.value,
    ...value,
  }
}

function readCards(storeValue: Record<string, any>): VarCardRecord[] {
  const candidates = [unref(storeValue.cards), unref(storeValue.allCards), unref(storeValue.items)]
  return candidates.find((candidate): candidate is VarCardRecord[] => Array.isArray(candidate)) ?? []
}

function findCardInList(cardList: VarCardRecord[]) {
  if (currentCardId.value) {
    return cardList.find((card) => card.id === currentCardId.value) ?? null
  }

  if (currentRecordType.value) {
    return cardList.find((card) => card.recordType === currentRecordType.value) ?? null
  }

  return null
}

async function ensureStore() {
  const storeLoader = storeLoaders["../stores/varCards.ts"]
  if (!storeLoader) {
    status.value = "missing-store"
    return null
  }

  const storeModule = await storeLoader() as {
    useVarCardStore?: () => Record<string, any>
  }

  if (typeof storeModule.useVarCardStore !== "function") {
    status.value = "missing-store"
    return null
  }

  const resolvedStore = storeModule.useVarCardStore()
  store.value = resolvedStore
  return resolvedStore
}

async function loadCardsFromStore(resolvedStore: Record<string, any>) {
  if (typeof resolvedStore.fetchCards === "function") {
    await resolvedStore.fetchCards()
  } else if (typeof resolvedStore.loadCards === "function") {
    await resolvedStore.loadCards()
  }

  cards.value = readCards(resolvedStore)
}

async function loadCurrentCard() {
  status.value = "loading"
  const resolvedStore = await ensureStore()

  if (!resolvedStore) {
    draft.value = createEmptyDraft()
    return
  }

  await loadCardsFromStore(resolvedStore)

  if (!currentCardId.value && !currentRecordType.value) {
    sourceManifest.value = null
    draft.value = createEmptyDraft()
    status.value = "ready"
    return
  }

  const card = findCardInList(cards.value)
  if (!card) {
    status.value = "missing-card"
    return
  }

  sourceManifest.value = structuredClone(card)
  draft.value = draftFromManifest(card)
  status.value = "ready"
}

async function saveCard() {
  if (!store.value || typeof store.value.saveCard !== "function") {
    message.error(t("varCards.studio.storeUnavailable"))
    return
  }

  saving.value = true
  try {
    const manifest = buildManifestFromDraft(draft.value, sourceManifest.value)
    const result = await store.value.saveCard(manifest)
    const savedCard = result && typeof result === "object" ? result : manifest

    sourceManifest.value = structuredClone(savedCard)
    draft.value = draftFromManifest(savedCard)
    await loadCardsFromStore(store.value)

    if (savedCard.id) {
      await router.replace({
        path: "/var-cards/studio",
        query: { id: String(savedCard.id) },
      })
    }

    message.success(t("varCards.studio.saved"))
  } catch (error) {
    message.error(String(error))
  } finally {
    saving.value = false
  }
}

async function cloneCard() {
  if (!store.value || typeof store.value.cloneCard !== "function") {
    message.error(t("varCards.studio.storeUnavailable"))
    return
  }

  const cardId = currentCardId.value || sourceManifest.value?.id
  if (!cardId) {
    message.error(t("varCards.studio.cloneUnavailable"))
    return
  }

  cloning.value = true
  try {
    const result = await store.value.cloneCard(cardId)
    const clonedCard =
      typeof result === "object" && result
        ? result
        : readCards(store.value).find((card) => card.id === result)

    await loadCardsFromStore(store.value)

    if (!clonedCard?.id) {
      throw new Error(t("varCards.studio.cloneUnavailable"))
    }

    message.success(t("varCards.studio.cloned"))
    await router.replace({
      path: "/var-cards/studio",
      query: { id: String(clonedCard.id) },
    })
  } catch (error) {
    message.error(String(error))
  } finally {
    cloning.value = false
  }
}

function goBack() {
  router.push("/var-cards")
}

watch(
  () => [route.query.id, route.query.recordType],
  async () => {
    await loadCurrentCard()
  },
)

onMounted(async () => {
  await loadCurrentCard()
})
</script>

<template>
  <div class="var-card-studio-page">
    <div v-if="status === 'loading'" class="center-state">
      <NSpin size="large" />
    </div>

    <NEmpty
      v-else-if="status === 'missing-store'"
      class="center-state"
      :description="t('varCards.studio.storeUnavailable')"
    />

    <NEmpty
      v-else-if="status === 'missing-card'"
      class="center-state"
      :description="t('varCards.studio.cardNotFound')"
    >
      <template #extra>
        <NButton @click="router.push('/var-cards')">{{ t("varCards.market.title") }}</NButton>
      </template>
    </NEmpty>

    <VarCardStudioLayout
      v-else
      :title="pageTitle"
      :subtitle="pageSubtitle"
    >
      <template #actions>
        <NSpace>
          <NButton @click="goBack">{{ t("common.close") }}</NButton>
          <NButton
            v-if="isReadOnly"
            type="primary"
            :loading="cloning"
            @click="cloneCard"
          >
            {{ t("common.clone") }}
          </NButton>
          <NButton
            v-else
            type="primary"
            :loading="saving"
            @click="saveCard"
          >
            {{ t("editor.save") }}
          </NButton>
        </NSpace>
      </template>

      <template #form>
        <NAlert v-if="isReadOnly" type="warning" :show-icon="false">
          {{ t("varCards.studio.readOnlyBanner") }}
        </NAlert>
        <VarCardFormPanel
          :draft="draft"
          :read-only="isReadOnly"
          @update:draft="updateDraft"
        />
      </template>

      <template #behavior>
        <VarCardBehaviorPanel
          :draft="draft"
          :read-only="isReadOnly"
          @update:draft="updateDraft"
        />
      </template>

      <template #preview>
        <VarCardLivePreviewPanel
          :draft="draft"
          :read-only="isReadOnly"
        />
      </template>
    </VarCardStudioLayout>
  </div>
</template>

<style scoped>
.var-card-studio-page {
  min-height: 100vh;
  padding: 24px;
}

.center-state {
  min-height: calc(100vh - 48px);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
