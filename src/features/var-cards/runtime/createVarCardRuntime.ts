import { h } from "vue"
import type { AimdTypePlugin, AimdTypePluginRenderContext, AimdVarInputKind, AimdProtocolRecordData } from "@airalogy/aimd-recorder"
import {
  AimdDnaSequenceField,
  AimdMarkdownField,
  createEmptyProtocolRecordData,
  formatDateForInput,
  formatDateTimeWithTimezone,
  getVarInputDisplayValue,
  normalizeDateTimeValueWithTimezone,
  normalizeDnaSequenceValue,
  parseVarInputValue,
  toBooleanValue,
} from "@airalogy/aimd-recorder"
import type { AimdVarNode } from "@airalogy/aimd-core/types"
import AimdCodeField from "@airalogy/aimd-recorder/components/AimdCodeField.vue"
import VarCardShell from "@/components/var-cards/VarCardShell.vue"
import type { CompiledVarCardManifest } from "./compileCardManifest"
import { compileCardManifest, type VarCardManifest } from "./compileCardManifest"

const PREVIEW_FIELD_ID = "var_card_preview"

export interface VarCardRuntime {
  manifest: VarCardManifest
  compiled: CompiledVarCardManifest
  typePlugin: AimdTypePlugin
  previewFieldId: string
  previewContent: string
  createPreviewRecord: (value?: unknown) => AimdProtocolRecordData
}

function createPreviewNode(runtime: VarCardRuntime): AimdVarNode {
  return {
    type: "aimd",
    fieldType: "var",
    id: runtime.previewFieldId,
    scope: "var",
    raw: runtime.previewContent,
    definition: {
      id: runtime.previewFieldId,
      type: runtime.manifest.recordType,
      kwargs: {
        title: runtime.manifest.title,
        description: runtime.manifest.description,
      },
    },
  }
}

function escapeQuotedValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

function createPreviewContent(manifest: VarCardManifest, fieldId: string): string {
  const parts = [`${fieldId}: ${manifest.recordType}`]

  if (manifest.title.trim()) {
    parts.push(`title="${escapeQuotedValue(manifest.title.trim())}"`)
  }
  if (manifest.description.trim()) {
    parts.push(`description="${escapeQuotedValue(manifest.description.trim())}"`)
  }

  return `{{var|${parts.join(", ")}}}`
}

function getFieldTitle(node: AimdVarNode | undefined, fallback: string): string {
  const title = node?.definition?.kwargs?.title
  return typeof title === "string" && title.trim() ? title.trim() : fallback
}

function getFieldDescription(node: AimdVarNode | undefined, fallback: string): string {
  const description = node?.definition?.kwargs?.description
  return typeof description === "string" && description.trim() ? description.trim() : fallback
}

function renderNativeFieldBody(
  runtime: VarCardRuntime,
  context: AimdTypePluginRenderContext,
): any {
  const inputKind = runtime.compiled.inputKind
  const disabled = context.disabled
  const placeholder = context.placeholder ?? runtime.compiled.placeholder

  if (runtime.compiled.enumOptions.length > 0) {
    return h("select", {
      class: "var-card-shell__select",
      disabled,
      value: context.value as string | number | undefined,
      onChange: (event: Event) => {
        context.emitChange((event.target as HTMLSelectElement).value)
      },
      onBlur: context.emitBlur,
    }, runtime.compiled.enumOptions.map(option =>
      h("option", { key: String(option.value), value: option.value as string | number | undefined }, option.label),
    ))
  }

  if (runtime.compiled.normalizedBaseType === "airalogymarkdown") {
    return h(AimdMarkdownField, {
      varId: context.node.id,
      modelValue: context.value,
      disabled,
      locale: context.locale,
      messages: context.messages,
      "onUpdate:modelValue": (nextValue: string) => context.emitChange(nextValue),
      onBlur: context.emitBlur,
    })
  }

  if (inputKind === "dna" || runtime.compiled.normalizedBaseType === "dnasequence") {
    return h(AimdDnaSequenceField, {
      varId: context.node.id,
      modelValue: context.value,
      disabled,
      placeholder,
      messages: context.messages,
      "onUpdate:modelValue": (nextValue: unknown) => context.emitChange(nextValue),
      onBlur: context.emitBlur,
    })
  }

  if (inputKind === "checkbox") {
    return h("label", { class: "var-card-shell__checkbox" }, [
      h("input", {
        type: "checkbox",
        disabled,
        checked: toBooleanValue(context.value),
        onChange: (event: Event) => {
          context.emitChange((event.target as HTMLInputElement).checked)
        },
        onBlur: context.emitBlur,
      }),
      h("span", { class: "var-card-shell__checkbox-label" }, "Enabled"),
    ])
  }

  if (inputKind === "textarea") {
    return h("textarea", {
      class: "var-card-shell__textarea",
      disabled,
      placeholder,
      rows: 4,
      value: typeof context.displayValue === "number" ? String(context.displayValue) : context.displayValue,
      onInput: (event: Event) => {
        context.emitChange((event.target as HTMLTextAreaElement).value)
      },
      onBlur: context.emitBlur,
    })
  }

  if (inputKind === "code") {
    return h(AimdCodeField, {
      modelValue: typeof context.displayValue === "number" ? String(context.displayValue) : context.displayValue,
      language: runtime.compiled.codeLanguage ?? "plaintext",
      disabled,
      "onUpdate:modelValue": (nextValue: string) => context.emitChange(nextValue),
      onBlur: context.emitBlur,
    })
  }

  if (inputKind === "text") {
    return h("textarea", {
      class: "var-card-shell__textarea var-card-shell__textarea--single-line",
      disabled,
      placeholder,
      rows: 1,
      value: typeof context.displayValue === "number" ? String(context.displayValue) : context.displayValue,
      onInput: (event: Event) => {
        context.emitChange((event.target as HTMLTextAreaElement).value)
      },
      onBlur: context.emitBlur,
    })
  }

  const htmlInputType = inputKind === "datetime" ? "datetime-local" : inputKind
  const value = inputKind === "date" || inputKind === "datetime" || inputKind === "time"
    ? formatDateForInput(context.value, inputKind)
    : context.displayValue

  return h("input", {
    class: "var-card-shell__input",
    type: htmlInputType,
    disabled,
    placeholder,
    step: inputKind === "time" ? "1" : undefined,
    inputmode: inputKind === "number" ? "decimal" : undefined,
    value,
    onInput: (event: Event) => {
      const rawValue = (event.target as HTMLInputElement).value
      context.emitChange(parseVarInputValue(rawValue, runtime.compiled.baseType, inputKind))
    },
    onBlur: context.emitBlur,
  })
}

function renderCardField(runtime: VarCardRuntime, context: AimdTypePluginRenderContext): any {
  const node = context.node as AimdVarNode
  const title = getFieldTitle(node, runtime.manifest.title)
  const description = getFieldDescription(node, runtime.manifest.description)

  return h(VarCardShell, {
    fieldId: node.id,
    title,
    description,
    cardTitle: runtime.manifest.title,
    accentColor: runtime.compiled.accentColor,
    readonly: context.readonly,
    classes: context.extraClasses,
  }, {
    default: () => [renderNativeFieldBody(runtime, context)],
  })
}

function getCardInitialValue(runtime: VarCardRuntime, context: Parameters<NonNullable<AimdTypePlugin["getInitialValue"]>>[0]): unknown {
  if (runtime.compiled.basePlugin?.getInitialValue) {
    return runtime.compiled.basePlugin.getInitialValue(context)
  }

  if (runtime.compiled.normalizedBaseType === "currenttime") {
    const now = context.now instanceof Date ? context.now : new Date(context.now ?? Date.now())
    return formatDateTimeWithTimezone(now)
  }

  if (runtime.compiled.normalizedBaseType === "username") {
    return context.currentUserName ?? ""
  }

  if (runtime.compiled.inputKind === "checkbox") {
    return false
  }

  if (runtime.compiled.inputKind === "dna") {
    return normalizeDnaSequenceValue(undefined)
  }

  return ""
}

function normalizeCardValue(runtime: VarCardRuntime, context: Parameters<NonNullable<AimdTypePlugin["normalizeValue"]>>[0]): unknown {
  if (runtime.compiled.basePlugin?.normalizeValue) {
    return runtime.compiled.basePlugin.normalizeValue(context)
  }

  if (runtime.compiled.inputKind === "datetime") {
    return normalizeDateTimeValueWithTimezone(context.value)
  }

  if (runtime.compiled.inputKind === "dna") {
    return normalizeDnaSequenceValue(context.value)
  }

  return context.value
}

function getCardDisplayValue(runtime: VarCardRuntime, context: Parameters<NonNullable<AimdTypePlugin["getDisplayValue"]>>[0]): string | number {
  if (runtime.compiled.basePlugin?.getDisplayValue) {
    return runtime.compiled.basePlugin.getDisplayValue(context)
  }

  return getVarInputDisplayValue(context.value, runtime.compiled.inputKind, {
    type: runtime.compiled.baseType,
  })
}

function createTypePlugin(runtime: VarCardRuntime): AimdTypePlugin {
  return {
    type: runtime.manifest.recordType,
    inputKind: runtime.compiled.inputKind,
    getInitialValue: context => getCardInitialValue(runtime, context),
    normalizeValue: context => normalizeCardValue(runtime, context),
    getDisplayValue: context => getCardDisplayValue(runtime, context),
    renderField: context => renderCardField(runtime, context) as any,
  }
}

export function createVarCardRuntime(manifest: VarCardManifest): VarCardRuntime {
  const compiled = compileCardManifest(manifest)
  const previewContent = createPreviewContent(manifest, PREVIEW_FIELD_ID)

  const runtime: VarCardRuntime = {
    manifest,
    compiled,
    typePlugin: {} as AimdTypePlugin,
    previewFieldId: PREVIEW_FIELD_ID,
    previewContent,
    createPreviewRecord(value = manifest.demoValue) {
      const record = createEmptyProtocolRecordData()
      record.var[PREVIEW_FIELD_ID] = value
      return record
    },
  }

  runtime.typePlugin = createTypePlugin(runtime)

  return runtime
}

export function createVarCardPreviewNode(runtime: VarCardRuntime): AimdVarNode {
  return createPreviewNode(runtime)
}
