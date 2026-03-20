import { h, type VNode } from "vue"
import { AimdRecorder, type AimdProtocolRecordData } from "@airalogy/aimd-recorder"
import type { VarCardRuntime } from "./createVarCardRuntime"

export interface RenderVarCardPreviewOptions {
  runtime: VarCardRuntime
  modelValue: AimdProtocolRecordData
  readonly?: boolean
  locale?: string
  currentUserName?: string
  now?: Date | string | number
  onUpdateModelValue?: (value: AimdProtocolRecordData) => void
}

export function renderVarCardPreview(options: RenderVarCardPreviewOptions): VNode {
  return h("div", { class: "var-card-preview-surface" }, [
    h(AimdRecorder, {
      content: options.runtime.previewContent,
      modelValue: options.modelValue,
      readonly: options.readonly,
      locale: options.locale,
      currentUserName: options.currentUserName,
      now: options.now,
      typePlugins: [options.runtime.typePlugin],
      "onUpdate:modelValue": options.onUpdateModelValue,
    }),
  ])
}
