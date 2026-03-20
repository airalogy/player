<script lang="ts">
import { defineComponent, ref, watch, type PropType } from "vue"
import type { AimdProtocolRecordData } from "@airalogy/aimd-recorder"
import { renderVarCardPreview } from "@/features/var-cards/runtime/renderVarCardPreview"
import type { VarCardRuntime } from "@/features/var-cards/runtime/createVarCardRuntime"

export default defineComponent({
  name: "VarCardPreviewSurface",
  props: {
    runtime: {
      type: Object as () => VarCardRuntime,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    locale: {
      type: String,
      default: "en-US",
    },
    currentUserName: {
      type: String,
      default: undefined,
    },
    now: {
      type: [Date, String, Number] as unknown as PropType<Date | string | number | undefined>,
      default: undefined,
    },
  },
  setup(props) {
    const previewRecord = ref<AimdProtocolRecordData>(props.runtime.createPreviewRecord())

    watch(() => props.runtime, nextRuntime => {
      previewRecord.value = nextRuntime.createPreviewRecord()
    }, { immediate: false })

    return () => renderVarCardPreview({
      runtime: props.runtime,
      modelValue: previewRecord.value,
      readonly: props.readonly,
      locale: props.locale,
      currentUserName: props.currentUserName,
      now: props.now,
      onUpdateModelValue: value => {
        previewRecord.value = value
      },
    })
  },
})
</script>
