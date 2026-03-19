import { defineStore } from "pinia"
import { ref } from "vue"

export interface EditorState {
  content: string
  filePath: string | null
  isDirty: boolean
  mode: "source" | "wysiwyg"
}

export const useEditorStore = defineStore("editor", () => {
  const content = ref("")
  const filePath = ref<string | null>(null)
  const isDirty = ref(false)
  const mode = ref<"source" | "wysiwyg">("source")
  const history = ref<string[]>([])
  const historyIndex = ref(-1)

  function setContent(newContent: string) {
    if (content.value !== newContent) {
      content.value = newContent
      isDirty.value = true
      pushHistory(newContent)
    }
  }

  function setFilePath(path: string | null) {
    filePath.value = path
  }

  function markClean() {
    isDirty.value = false
  }

  function setMode(newMode: "source" | "wysiwyg") {
    mode.value = newMode
  }

  function pushHistory(state: string) {
    if (history.value.length > 50) {
      history.value.shift()
    }
    history.value.push(state)
    historyIndex.value = history.value.length - 1
  }

  function undo(): string | null {
    if (historyIndex.value > 0) {
      historyIndex.value--
      content.value = history.value[historyIndex.value]
      return content.value
    }
    return null
  }

  function redo(): string | null {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      content.value = history.value[historyIndex.value]
      return content.value
    }
    return null
  }

  function loadContent(newContent: string, path: string) {
    content.value = newContent
    filePath.value = path
    isDirty.value = false
    history.value = [newContent]
    historyIndex.value = 0
  }

  function reset() {
    content.value = ""
    filePath.value = null
    isDirty.value = false
    history.value = []
    historyIndex.value = -1
  }

  return {
    content,
    filePath,
    isDirty,
    mode,
    history,
    historyIndex,
    setContent,
    setFilePath,
    loadContent,
    markClean,
    setMode,
    pushHistory,
    undo,
    redo,
    reset,
  }
})
