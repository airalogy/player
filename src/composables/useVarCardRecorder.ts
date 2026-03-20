import { computed, type MaybeRefOrGetter, toValue } from "vue"
import { BUILT_IN_CODE_STR_TYPES } from "@airalogy/aimd-recorder/code-types"
import { createRecorderTypePlugins } from "@/features/var-cards/runtime/createRecorderTypePlugins"
import type { VarCardManifest } from "@/features/var-cards/runtime/compileCardManifest"

function toBuiltinRecordType(slug: string): string {
  return `card:builtin/${slug}`
}

function createBuiltinVarCardManifests(): VarCardManifest[] {
  const baseCards: VarCardManifest[] = [
    {
      id: "current-time",
      namespace: "builtin",
      version: "1.0.0",
      title: "Current Time",
      description: "Auto-populates the current timestamp when the record starts.",
      tags: ["datetime", "system"],
      readonly: true,
      recordType: toBuiltinRecordType("current-time"),
      demoValue: "",
      schema: {
        baseType: "CurrentTime",
      },
      appearance: {
        accentColor: "#2f855a",
      },
    },
    {
      id: "user-name",
      namespace: "builtin",
      version: "1.0.0",
      title: "User Name",
      description: "Captures the current operator name from the host app.",
      tags: ["identity", "system"],
      readonly: true,
      recordType: toBuiltinRecordType("user-name"),
      demoValue: "",
      schema: {
        baseType: "UserName",
      },
      appearance: {
        accentColor: "#0f766e",
      },
    },
    {
      id: "airalogy-markdown",
      namespace: "builtin",
      version: "1.0.0",
      title: "Markdown Notes",
      description: "Rich markdown editor for experiment notes and narrative output.",
      tags: ["markdown", "notes"],
      readonly: false,
      recordType: toBuiltinRecordType("airalogy-markdown"),
      demoValue: "## Observation\n\n- Sample stable\n- Record synchronized",
      schema: {
        baseType: "AiralogyMarkdown",
      },
      appearance: {
        accentColor: "#b45309",
      },
    },
    {
      id: "dna-sequence",
      namespace: "builtin",
      version: "1.0.0",
      title: "DNA Sequence",
      description: "Structured sequence editor for annotated DNA inputs.",
      tags: ["sequence", "bio"],
      readonly: false,
      recordType: toBuiltinRecordType("dna-sequence"),
      demoValue: undefined,
      schema: {
        baseType: "DNASequence",
      },
      appearance: {
        accentColor: "#7c3aed",
      },
    },
  ]

  const codeCards: VarCardManifest[] = BUILT_IN_CODE_STR_TYPES.map(typeName => {
    const slug = typeName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
    return {
      id: slug,
      namespace: "builtin",
      version: "1.0.0",
      title: typeName,
      description: `${typeName} rendered through the recorder code editor.`,
      tags: ["code"],
      readonly: false,
      recordType: toBuiltinRecordType(slug),
      demoValue: typeName === "JsonStr"
        ? '{\n  "status": "ok"\n}'
        : typeName === "PyStr"
          ? 'print("hello world")'
          : "",
      schema: {
        baseType: typeName,
      },
      appearance: {
        accentColor: "#1d4ed8",
      },
    }
  })

  return [...baseCards, ...codeCards]
}

export function useVarCardRecorder(manifests?: MaybeRefOrGetter<VarCardManifest[]>) {
  const resolvedManifests = computed(() => toValue(manifests) ?? createBuiltinVarCardManifests())
  return createRecorderTypePlugins(resolvedManifests)
}
