<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import * as monaco from "monaco-editor"
import { initMonaco } from "@/composables/useMonaco"

const props = defineProps<{
  modelValue: string
  readOnly?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!editorContainer.value) return

  initMonaco()

  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: "aimd",
    theme: "aimd-light",
    readOnly: props.readOnly ?? false,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on",
    wordWrap: "on",
    automaticLayout: true,
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
    renderLineHighlight: "line",
    cursorBlinking: "smooth",
    smoothScrolling: true,
    tabSize: 2,
  })

  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() ?? ""
    emit("update:modelValue", value)
  })
})

onBeforeUnmount(() => {
  editor?.dispose()
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && editor.getValue() !== newValue) {
      editor.setValue(newValue)
    }
  }
)

watch(
  () => props.readOnly,
  (readOnly) => {
    editor?.updateOptions({ readOnly: readOnly ?? false })
  }
)

defineExpose({
  getContent: () => editor?.getValue() ?? "",
  setContent: (value: string) => editor?.setValue(value),
  getEditor: () => editor,
})
</script>

<template>
  <div ref="editorContainer" class="monaco-editor-container" />
</template>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
}
</style>
