<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, unref, type PropType } from "vue"
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { invoke } from "@tauri-apps/api/core"
import { useMessage } from "naive-ui"
import { AimdRecorder, createEmptyProtocolRecordData } from "@airalogy/aimd-recorder"
import "@airalogy/aimd-recorder/styles"
import { NButton, NButtonGroup, NEmpty, NInput, NSpin, NTag } from "naive-ui"
import VarCardGallery from "@/components/var-cards/VarCardGallery.vue"
import VarCardPreviewDialog from "@/components/var-cards/VarCardPreviewDialog.vue"
import type { VarCardGalleryCard } from "@/components/var-cards/VarCardGalleryItem.vue"
import type { AimdProtocolRecordData } from "@airalogy/aimd-recorder"

type NamespaceFilter = "all" | "builtin" | "user"

interface VarCardStoreLike {
  cards?: unknown
  fetchCards?: () => Promise<unknown>
  cloneCard?: (id: string) => Promise<unknown>
}

interface RemoteCardInput {
  id?: string
  title?: string
  description?: string
  icon?: string
  tags?: string[]
  namespace?: "builtin" | "user"
  readonly?: boolean
  demoValue?: unknown
  recordType?: string
  baseCardId?: string | null
  previewContent?: string
}

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const loading = ref(true)
const searchQuery = ref("")
const namespaceFilter = ref<NamespaceFilter>("all")
const selectedCard = ref<VarCardGalleryCard | null>(null)
const previewOpen = ref(false)
const localCards = ref<VarCardGalleryCard[]>([])
const storeApi = ref<VarCardStoreLike | null>(null)

const InlineCardPreview = defineComponent({
  name: "InlineVarCardPreview",
  props: {
    card: {
      type: Object as PropType<VarCardGalleryCard>,
      required: true,
    },
  },
  setup(props) {
    const record = ref<AimdProtocolRecordData>(createEmptyProtocolRecordData())
    const { locale } = useI18n()
    const recorderLocale = computed(() => (locale.value === "zh" ? "zh-CN" : "en-US"))

    return () =>
      h("div", { class: "market-inline-preview" }, [
        h(AimdRecorder, {
          modelValue: record.value,
          "onUpdate:modelValue": (value: AimdProtocolRecordData) => {
            record.value = value
          },
          content: props.card.previewContent,
          readonly: false,
          locale: recorderLocale.value,
          currentUserName: "Dr. Lin",
          class: "market-inline-preview__surface",
        }),
      ])
  },
})

const builtInCards: VarCardGalleryCard[] = [
  {
    id: "builtin-current-time",
    title: "Current Time",
    description: "Timestamp fields for quick experiment logging and operator-friendly chronology.",
    icon: "◷",
    tags: ["time", "logging", "builtin"],
    namespace: "builtin",
    readonly: true,
    demoValue: "2026-03-20T09:30:00Z",
    recordType: "card:builtin/current-time",
    previewContent: `# Current Time\n\nRecord time: {{var|recorded_at: CurrentTime}}`,
  },
  {
    id: "builtin-user-name",
    title: "User Name",
    description: "Prefilled identity capture for operator attribution, sign-off, and traceability.",
    icon: "◉",
    tags: ["identity", "operator", "builtin"],
    namespace: "builtin",
    readonly: true,
    demoValue: "Dr. Lin",
    recordType: "card:builtin/user-name",
    previewContent: `# User Name\n\nOperator: {{var|operator_name: UserName}}`,
  },
  {
    id: "builtin-markdown",
    title: "Lab Notes",
    description: "Rich markdown notes with AIMD-aware editing for procedures, observations, and deviations.",
    icon: "✎",
    tags: ["notes", "markdown", "documentation"],
    namespace: "builtin",
    readonly: true,
    demoValue: "# Observation\nCells reached 80% confluence.",
    recordType: "card:builtin/airalogy-markdown",
    previewContent: `# Lab Notes\n\nNotes: {{var|notes: AiralogyMarkdown}}`,
  },
  {
    id: "builtin-dna-sequence",
    title: "DNA Sequence",
    description: "Sequence-aware capture for plasmids and constructs with structured metadata support.",
    icon: "DNA",
    tags: ["biology", "sequence", "construct"],
    namespace: "builtin",
    readonly: true,
    demoValue: { name: "pAIMD-Reporter", sequence: "ATGCGTACCGTTAA" },
    recordType: "card:builtin/dna-sequence",
    previewContent: `# DNA Sequence\n\nPlasmid: {{var|plasmid: DNASequence}}`,
  },
  {
    id: "builtin-python-code",
    title: "Python Snippet",
    description: "Code-native capture for analysis fragments, automation recipes, and reproducible transforms.",
    icon: "</>",
    tags: ["code", "python", "analysis"],
    namespace: "builtin",
    readonly: true,
    demoValue: "print('hello AIMD')",
    recordType: "card:builtin/python-snippet",
    previewContent: `# Python Snippet\n\nAnalysis code: {{var|analysis_code: PyStr}}`,
  },
]

const filterOptions = computed(() => [
  { label: t("varCards.filters.all"), value: "all" },
  { label: t("varCards.filters.builtin"), value: "builtin" },
  { label: t("varCards.filters.user"), value: "user" },
])

const cards = computed<VarCardGalleryCard[]>(() => {
  const storeCards = storeApi.value?.cards
  const source = Array.isArray(unref(storeCards))
    ? normalizeCards(unref(storeCards) as RemoteCardInput[])
    : localCards.value

  return source
})

const filteredCards = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return cards.value.filter((card) => {
    const matchesNamespace =
      namespaceFilter.value === "all" || card.namespace === namespaceFilter.value

    if (!matchesNamespace) return false
    if (!query) return true

    return [
      card.title,
      card.description,
      card.recordType,
      ...card.tags,
    ].some((value) => value.toLowerCase().includes(query))
  })
})

const builtInCount = computed(() => cards.value.filter((card) => card.namespace === "builtin").length)
const userCount = computed(() => cards.value.filter((card) => card.namespace === "user").length)

onMounted(async () => {
  await loadCards()
})

async function loadCards() {
  loading.value = true

  try {
    const compatibleStore = await loadCompatibleStore()
    if (compatibleStore) {
      storeApi.value = compatibleStore
      await compatibleStore.fetchCards?.()
      return
    }

    localCards.value = await loadFallbackCards()
  } finally {
    loading.value = false
  }
}

async function loadCompatibleStore(): Promise<VarCardStoreLike | null> {
  const modules = import.meta.glob("../stores/*.ts")
  const storeLoader = Object.entries(modules).find(([path]) => path.endsWith("/varCards.ts"))?.[1]

  if (!storeLoader) return null

  const mod = await storeLoader()
  const useVarCardStore = (mod as { useVarCardStore?: () => VarCardStoreLike }).useVarCardStore
  if (typeof useVarCardStore !== "function") return null

  return useVarCardStore()
}

async function loadFallbackCards(): Promise<VarCardGalleryCard[]> {
  try {
    const remote = await invoke<RemoteCardInput[]>("list_var_cards")
    return normalizeCards(remote)
  } catch {
    return builtInCards
  }
}

function normalizeCards(rawCards: RemoteCardInput[]): VarCardGalleryCard[] {
  const merged = rawCards.length > 0 ? rawCards : builtInCards

  return merged.map((card, index) => ({
    id: card.id ?? `var-card-${index}`,
    title: card.title ?? "Untitled card",
    description: card.description ?? "",
    icon: card.icon ?? "◧",
    tags: Array.isArray(card.tags) ? card.tags : [],
    namespace: card.namespace === "user" ? "user" : "builtin",
    readonly: Boolean(card.readonly ?? card.namespace !== "user"),
    demoValue: card.demoValue,
    recordType: card.recordType ?? `card:${card.namespace ?? "builtin"}/${card.id ?? index}`,
    baseCardId: card.baseCardId ?? null,
    previewContent: card.previewContent ?? createPreviewContent(card),
  }))
}

function createPreviewContent(card: RemoteCardInput): string {
  const fieldName = (card.id ?? "field").replace(/[^a-zA-Z0-9_]+/g, "_")
  const typeName = resolvePreviewType(card.recordType)
  return `# ${card.title ?? "Card Preview"}\n\n${card.title ?? "Value"}: {{var|${fieldName}: ${typeName}}}`
}

function resolvePreviewType(recordType?: string): string {
  const normalized = recordType?.toLowerCase() ?? ""

  if (normalized.includes("markdown")) return "AiralogyMarkdown"
  if (normalized.includes("dna")) return "DNASequence"
  if (normalized.includes("time")) return "CurrentTime"
  if (normalized.includes("user")) return "UserName"
  if (normalized.includes("python")) return "PyStr"
  return "str"
}

function openPreview(card: VarCardGalleryCard) {
  selectedCard.value = card
  previewOpen.value = true
}

async function cloneCard(card: VarCardGalleryCard) {
  try {
    const storeClone = storeApi.value?.cloneCard
    if (typeof storeClone === "function") {
      await storeClone(card.id)
      await storeApi.value?.fetchCards?.()
    } else {
      await invoke("clone_var_card", { id: card.id })
      localCards.value = await loadFallbackCards()
    }

    message.success(t("varCards.feedback.cloneSuccess", { title: card.title }))
  } catch {
    const clonedCard: VarCardGalleryCard = {
      ...card,
      id: `${card.id}-clone`,
      title: `${card.title} Copy`,
      namespace: "user",
      readonly: false,
      baseCardId: card.baseCardId ?? card.id,
      recordType: card.recordType.replace("card:builtin/", "card:user/"),
    }

    localCards.value = [clonedCard, ...cards.value.filter((existing) => existing.id !== clonedCard.id)]
    message.success(t("varCards.feedback.cloneLocalOnly", { title: card.title }))
  }
}

function editCard(card: VarCardGalleryCard) {
  const resolved = router.resolve({ path: "/var-cards/studio", query: { id: card.id } })

  if (resolved.matched.length > 0) {
    router.push(resolved)
    return
  }

  message.info(t("varCards.feedback.studioUnavailable"))
}
</script>

<template>
  <div class="var-card-market-page">
    <section class="market-hero">
      <div class="market-hero__copy">
        <span class="market-hero__eyebrow">{{ t("varCards.eyebrow") }}</span>
        <h1 class="market-hero__title">{{ t("varCards.title") }}</h1>
        <p class="market-hero__subtitle">{{ t("varCards.subtitle") }}</p>

        <div class="market-hero__stats">
          <div class="market-stat">
            <strong>{{ cards.length }}</strong>
            <span>{{ t("varCards.stats.total") }}</span>
          </div>
          <div class="market-stat">
            <strong>{{ builtInCount }}</strong>
            <span>{{ t("varCards.stats.builtin") }}</span>
          </div>
          <div class="market-stat">
            <strong>{{ userCount }}</strong>
            <span>{{ t("varCards.stats.user") }}</span>
          </div>
        </div>
      </div>

      <div class="market-hero__panel">
        <div class="market-hero__panel-glow" />
        <p class="market-hero__panel-label">{{ t("varCards.heroPanel.label") }}</p>
        <h2 class="market-hero__panel-title">{{ t("varCards.heroPanel.title") }}</h2>
        <p class="market-hero__panel-text">{{ t("varCards.heroPanel.description") }}</p>
        <div class="market-hero__panel-tags">
          <NTag size="small" round :bordered="false">{{ t("varCards.heroPanel.tagPreview") }}</NTag>
          <NTag size="small" round :bordered="false">{{ t("varCards.heroPanel.tagClone") }}</NTag>
          <NTag size="small" round :bordered="false">{{ t("varCards.heroPanel.tagRuntime") }}</NTag>
        </div>
      </div>
    </section>

    <section class="market-controls">
      <NInput
        v-model:value="searchQuery"
        clearable
        size="large"
        class="market-search"
        :placeholder="t('varCards.searchPlaceholder')"
      />
      <NButtonGroup class="market-segmented">
        <NButton
          v-for="option in filterOptions"
          :key="option.value"
          :type="namespaceFilter === option.value ? 'primary' : 'default'"
          @click="namespaceFilter = option.value as NamespaceFilter"
        >
          {{ option.label }}
        </NButton>
      </NButtonGroup>
    </section>

    <section class="market-gallery">
      <div v-if="loading" class="market-state">
        <NSpin size="large" />
      </div>

      <NEmpty
        v-else-if="filteredCards.length === 0"
        :description="t('varCards.empty')"
        class="market-state"
      >
        <template #extra>
          <NButton quaternary @click="searchQuery = ''">{{ t("varCards.actions.clearSearch") }}</NButton>
        </template>
      </NEmpty>

      <VarCardGallery
        v-else
        :cards="filteredCards"
        @preview="openPreview"
        @clone="cloneCard"
        @edit="editCard"
      >
        <template #preview="{ card }">
          <InlineCardPreview :card="card" />
        </template>
      </VarCardGallery>
    </section>

    <VarCardPreviewDialog
      v-model:show="previewOpen"
      :card="selectedCard"
      @clone="cloneCard"
      @edit="editCard"
    />
  </div>
</template>

<style scoped>
.var-card-market-page {
  min-height: 100%;
  padding: 28px;
  background:
    radial-gradient(circle at top left, rgba(214, 234, 248, 0.75), transparent 34%),
    radial-gradient(circle at top right, rgba(251, 226, 205, 0.78), transparent 28%),
    linear-gradient(180deg, #f6f8fb 0%, #eef3f8 100%);
  overflow: auto;
}

.market-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(300px, 0.9fr);
  gap: 24px;
  align-items: stretch;
  margin-bottom: 24px;
}

.market-hero__copy,
.market-hero__panel {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  padding: 28px;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.market-hero__copy {
  background:
    linear-gradient(135deg, rgba(13, 27, 42, 0.95), rgba(32, 65, 104, 0.92)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0));
  color: #fff;
  box-shadow: 0 26px 60px rgba(15, 23, 42, 0.18);
}

.market-hero__eyebrow {
  display: inline-block;
  margin-bottom: 14px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.market-hero__title {
  margin: 0;
  font-size: clamp(32px, 5vw, 50px);
  line-height: 1;
}

.market-hero__subtitle {
  max-width: 620px;
  margin: 16px 0 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 16px;
  line-height: 1.7;
}

.market-hero__stats {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.market-stat {
  min-width: 120px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
}

.market-stat strong {
  display: block;
  font-size: 28px;
}

.market-stat span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.market-hero__panel {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 246, 249, 0.94));
  box-shadow: 0 20px 42px rgba(15, 23, 42, 0.08);
}

.market-hero__panel-glow {
  position: absolute;
  right: -50px;
  top: -60px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.2), transparent 64%);
}

.market-hero__panel-label {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(19, 34, 56, 0.58);
}

.market-hero__panel-title {
  margin: 0;
  font-size: 26px;
  color: #132238;
}

.market-hero__panel-text {
  margin: 14px 0 18px;
  line-height: 1.7;
  color: rgba(19, 34, 56, 0.76);
}

.market-hero__panel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.market-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.market-search {
  max-width: 420px;
}

.market-segmented {
  min-width: 260px;
}

.market-gallery {
  min-height: 380px;
}

.market-inline-preview {
  height: 100%;
  overflow: hidden;
}

:deep(.market-inline-preview__surface) {
  transform: scale(0.78);
  transform-origin: top left;
  width: 128%;
  min-height: 220px;
  pointer-events: none;
}

.market-state {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

@media (max-width: 1024px) {
  .market-hero {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .var-card-market-page {
    padding: 18px;
  }

  .market-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .market-search {
    max-width: none;
  }
}
</style>
