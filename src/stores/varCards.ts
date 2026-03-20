import { computed, ref } from "vue"
import { defineStore } from "pinia"
import { cloneVarCard, deleteUserVarCard, getUserVarCard, listUserVarCards, saveUserVarCard } from "@/features/var-cards/api"
import { getBuiltinVarCardManifests } from "@/features/var-cards/builtin"
import type { VarCardKey, VarCardManifest, VarCardNamespace } from "@/features/var-cards/types"
import { parseVarCardKey, toVarCardKey, toVarCardRecordType } from "@/features/var-cards/types"

function slugifyCardId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

function makeCloneId(source: VarCardManifest, existingCards: VarCardManifest[]): string {
  const baseSlug = slugifyCardId(source.id) || "var-card"
  const existingIds = new Set(
    existingCards.filter((card) => card.namespace === "user").map((card) => card.id)
  )

  let nextId = `${baseSlug}-copy`
  let index = 2
  while (existingIds.has(nextId)) {
    nextId = `${baseSlug}-copy-${index}`
    index += 1
  }
  return nextId
}

function matchesCard(card: VarCardManifest, id: string): boolean {
  const parsed = parseVarCardKey(id)
  if (parsed) {
    return parsed.namespace === card.namespace && parsed.id === card.id
  }
  return card.id === id
}

function buildRecordTypeMap(cards: VarCardManifest[]): Record<string, VarCardManifest> {
  return cards.reduce<Record<string, VarCardManifest>>((acc, card) => {
    acc[card.recordType] = card
    return acc
  }, {})
}

export const useVarCardStore = defineStore("varCards", () => {
  const builtinCards = ref<VarCardManifest[]>(getBuiltinVarCardManifests())
  const userCards = ref<VarCardManifest[]>([])
  const selectedCardId = ref<VarCardKey | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  const cards = computed(() => [...builtinCards.value, ...userCards.value])
  const cardsByRecordType = computed(() => buildRecordTypeMap(cards.value))
  const selectedCard = computed(
    () => cards.value.find((card) => selectedCardId.value && matchesCard(card, selectedCardId.value)) ?? null
  )

  async function fetchCards(): Promise<VarCardManifest[]> {
    loading.value = true
    error.value = null
    try {
      userCards.value = await listUserVarCards()
      initialized.value = true
      return cards.value
    } catch (err) {
      error.value = String(err)
      return cards.value
    } finally {
      loading.value = false
    }
  }

  async function openCard(id: string): Promise<VarCardManifest | null> {
    error.value = null

    const localMatch = cards.value.find((card) => matchesCard(card, id))
    if (localMatch) {
      selectedCardId.value = toVarCardKey(localMatch.namespace, localMatch.id)
      return localMatch
    }

    const parsed = parseVarCardKey(id)
    if (parsed?.namespace === "user") {
      try {
        const manifest = await getUserVarCard(parsed.id)
        upsertUserCard(manifest)
        selectedCardId.value = toVarCardKey(manifest.namespace, manifest.id)
        return manifest
      } catch (err) {
        error.value = String(err)
      }
    }

    return null
  }

  async function cloneCard(id: string): Promise<VarCardManifest | null> {
    const sourceCard = cards.value.find((card) => matchesCard(card, id))
    if (!sourceCard) {
      error.value = `Var Card not found: ${id}`
      return null
    }

    loading.value = true
    error.value = null
    try {
      const newId = makeCloneId(sourceCard, cards.value)
      const clonedCard = await cloneVarCard({
        sourceManifest: sourceCard,
        newId,
      })
      upsertUserCard(clonedCard)
      selectedCardId.value = toVarCardKey("user", clonedCard.id)
      return clonedCard
    } catch (err) {
      error.value = String(err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function saveCard(manifest: VarCardManifest): Promise<VarCardManifest | null> {
    loading.value = true
    error.value = null
    try {
      const normalized = normalizeUserCard(manifest)
      const savedCard = await saveUserVarCard(normalized)
      upsertUserCard(savedCard)
      selectedCardId.value = toVarCardKey("user", savedCard.id)
      return savedCard
    } catch (err) {
      error.value = String(err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteCard(id: string): Promise<boolean> {
    const parsed = parseVarCardKey(id)
    const target = cards.value.find((card) => matchesCard(card, id))
    if (!target || (parsed?.namespace ?? target.namespace) !== "user") {
      error.value = `Only user Var Cards can be deleted: ${id}`
      return false
    }

    loading.value = true
    error.value = null
    try {
      await deleteUserVarCard(target.id)
      userCards.value = userCards.value.filter((card) => card.id !== target.id)
      if (selectedCardId.value === toVarCardKey("user", target.id)) {
        selectedCardId.value = null
      }
      return true
    } catch (err) {
      error.value = String(err)
      return false
    } finally {
      loading.value = false
    }
  }

  function upsertUserCard(manifest: VarCardManifest): void {
    const nextCards = userCards.value.filter((card) => card.id !== manifest.id)
    nextCards.push(normalizeUserCard(manifest))
    nextCards.sort((left, right) => left.title.localeCompare(right.title))
    userCards.value = nextCards
  }

  function normalizeUserCard(manifest: VarCardManifest): VarCardManifest {
    const id = slugifyCardId(manifest.id) || "var-card"
    return {
      ...manifest,
      id,
      namespace: "user",
      readonly: false,
      baseCardId:
        manifest.baseCardId ?? (manifest.namespace !== "user" ? toVarCardKey(manifest.namespace, manifest.id) : null),
      recordType: toVarCardRecordType("user", id),
    }
  }

  function setBuiltinCards(nextCards: VarCardManifest[]): void {
    builtinCards.value = nextCards.map((card) => ({ ...card }))
  }

  function getCardKey(namespace: VarCardNamespace, id: string): VarCardKey {
    return toVarCardKey(namespace, id)
  }

  return {
    cards,
    cardsByRecordType,
    selectedCard,
    selectedCardId,
    loading,
    error,
    initialized,
    fetchCards,
    openCard,
    cloneCard,
    saveCard,
    deleteCard,
    setBuiltinCards,
    getCardKey,
  }
})
