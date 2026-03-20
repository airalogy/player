import { unref } from "vue"
import type { AimdVarTypePresetOption } from "@airalogy/aimd-editor"

export interface EditorVarCardPresetSource {
  id: string
  title: string
  description?: string | null
  namespace?: string | null
  readonly?: boolean
  recordType: string
}

function normalizeRecordType(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function toFriendlyDescription(card: EditorVarCardPresetSource): string {
  const segments: string[] = []

  if (card.namespace === "builtin") {
    segments.push("Built-in card")
  } else if (card.namespace === "user") {
    segments.push("Custom card")
  }

  if (card.description) {
    segments.push(card.description)
  }

  return segments.join(" · ")
}

export function createEditorVarTypePresets(
  cards: EditorVarCardPresetSource[],
): AimdVarTypePresetOption[] {
  const seen = new Set<string>()

  return [...cards]
    .filter((card) => normalizeRecordType(card.recordType))
    .sort((left, right) => {
      const leftRank = left.namespace === "builtin" ? 0 : 1
      const rightRank = right.namespace === "builtin" ? 0 : 1
      if (leftRank !== rightRank) return leftRank - rightRank
      return left.title.localeCompare(right.title)
    })
    .flatMap((card) => {
      const recordType = normalizeRecordType(card.recordType)
      const normalizedKey = recordType.toLowerCase()
      if (!recordType || seen.has(normalizedKey)) {
        return []
      }

      seen.add(normalizedKey)

      return [{
        key: `var-card:${card.id}`,
        value: recordType,
        label: card.title,
        desc: toFriendlyDescription(card),
      }]
    })
}

function readCardsFromStore(store: Record<string, unknown>): EditorVarCardPresetSource[] {
  const candidates = [
    unref(store.cards),
    unref(store.allCards),
    unref(store.items),
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as EditorVarCardPresetSource[]
    }
  }

  return []
}

export async function loadEditorVarTypePresets(): Promise<AimdVarTypePresetOption[]> {
  const storeLoaders = import.meta.glob("../../../stores/varCards.ts")
  const storeLoader = storeLoaders["../../../stores/varCards.ts"]

  if (!storeLoader) {
    return []
  }

  try {
    const storeModule = await storeLoader() as {
      useVarCardStore?: () => Record<string, unknown>
    }
    const useVarCardStore = storeModule.useVarCardStore

    if (typeof useVarCardStore !== "function") {
      return []
    }

    const store = useVarCardStore()

    if (typeof store.fetchCards === "function") {
      await store.fetchCards()
    } else if (typeof store.loadCards === "function") {
      await store.loadCards()
    }

    return createEditorVarTypePresets(readCardsFromStore(store))
  } catch {
    return []
  }
}
