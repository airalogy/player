<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { NButton, NSpace, NSelect, NEmpty, NSpin, NInput, NModal, useMessage } from "naive-ui"
import { AimdEditor } from "@airalogy/aimd-editor"
import { useProjectStore } from "@/stores/project"
import { useEditorStore } from "@/stores/editor"
import { invoke } from "@tauri-apps/api/core"

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const message = useMessage()

const projectStore = useProjectStore()
const editorStore = useEditorStore()

type Status = "loading" | "no-project" | "no-files" | "ready"

const status = ref<Status>("loading")
const files = ref<string[]>([])
const selectedFile = ref<string | null>(null)
const fileContent = ref("")
const saving = ref(false)
const showNewFileModal = ref(false)
const newFileName = ref("")
const creatingFile = ref(false)

const projectId = computed(() => route.query.project as string | undefined)
const fileParam = computed(() => route.query.file as string | undefined)

const fileSelectOptions = computed(() =>
  files.value.map((f) => ({ label: f, value: f }))
)

async function load() {
  const id = projectId.value
  if (!id) {
    status.value = "no-project"
    return
  }

  status.value = "loading"

  let project =
    projectStore.currentProject?.id === id
      ? projectStore.currentProject
      : await projectStore.openProject(id)

  if (!project) {
    status.value = "no-project"
    return
  }

  let entries: { name: string; is_dir: boolean }[] = []
  try {
    entries = await invoke("list_files", { dir: project.path })
  } catch (e) {
    console.error("Failed to list files:", e)
  }

  files.value = entries
    .filter((f) => !f.is_dir && f.name.endsWith(".aimd"))
    .map((f) => f.name)

  if (files.value.length === 0) {
    status.value = "no-files"
    return
  }

  const target =
    fileParam.value && files.value.includes(fileParam.value)
      ? fileParam.value
      : files.value[0]

  await openFile(project.path, target)
  status.value = "ready"
}

async function openFile(projectPath: string, filename: string) {
  const path = `${projectPath}/${filename}`
  const content = await invoke<string>("read_file", { path })
  fileContent.value = content
  editorStore.loadContent(content, path)
  selectedFile.value = filename
  router.replace({
    query: { ...route.query, file: filename },
  })
}

async function handleFileSwitch(filename: string) {
  if (filename === selectedFile.value) return
  if (editorStore.isDirty) {
    await save()
  }
  const project = projectStore.currentProject
  if (project) {
    await openFile(project.path, filename)
  }
}

async function save() {
  if (!editorStore.filePath) return
  saving.value = true
  try {
    await invoke("write_file", {
      path: editorStore.filePath,
      content: fileContent.value,
    })
    editorStore.markClean()
    message.success(t("editor.saved"))
  } catch (e) {
    message.error(t("editor.saveFailed"))
  } finally {
    saving.value = false
  }
}

async function createNewFile() {
  let name = newFileName.value.trim()
  if (!name) return
  if (!name.endsWith(".aimd")) name += ".aimd"

  const project = projectStore.currentProject
  if (!project) return

  creatingFile.value = true
  try {
    const path = `${project.path}/${name}`
    await invoke("write_file", { path, content: `# ${name.replace(".aimd", "")}\n\n` })
    files.value.push(name)
    showNewFileModal.value = false
    newFileName.value = ""
    await openFile(project.path, name)
    status.value = "ready"
  } catch (e) {
    message.error(String(e))
  } finally {
    creatingFile.value = false
  }
}

function handleContentChange(val: string) {
  fileContent.value = val
  editorStore.setContent(val)
}

function goBack() {
  if (projectId.value) {
    router.push(`/protocol?project=${projectId.value}`)
  } else {
    router.push("/projects")
  }
}

onMounted(load)

// Reload when project param changes (e.g. navigating between projects)
watch(projectId, (newId, oldId) => {
  if (newId !== oldId) load()
})
</script>

<template>
  <div class="editor-page">
    <!-- Loading -->
    <div v-if="status === 'loading'" class="center-state">
      <NSpin size="large" />
    </div>

    <!-- No project selected -->
    <div v-else-if="status === 'no-project'" class="center-state">
      <NEmpty :description="t('editor.noProject')">
        <template #extra>
          <NButton type="primary" @click="router.push('/projects')">
            {{ t("nav.projects") }}
          </NButton>
        </template>
      </NEmpty>
    </div>

    <!-- Project has no AIMD files -->
    <div v-else-if="status === 'no-files'" class="center-state">
      <NEmpty :description="t('editor.noFiles')">
        <template #extra>
          <NButton type="primary" @click="showNewFileModal = true">
            {{ t("editor.newFile") }}
          </NButton>
        </template>
      </NEmpty>
    </div>

    <!-- Ready: editor -->
    <template v-else>
      <header class="editor-header">
        <NSpace align="center" :size="8">
          <NButton quaternary circle @click="goBack">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </template>
          </NButton>
          <span class="project-name">{{ projectStore.currentProject?.name }}</span>
          <span class="sep">/</span>
          <NSelect
            v-if="files.length > 1"
            :value="selectedFile"
            :options="fileSelectOptions"
            size="small"
            style="width: 220px"
            @update:value="handleFileSwitch"
          />
          <span v-else class="file-name">{{ selectedFile }}</span>
        </NSpace>

        <NSpace :size="8">
          <span v-if="editorStore.isDirty" class="dirty-indicator">●</span>
          <NButton size="small" @click="showNewFileModal = true">
            {{ t("editor.newFile") }}
          </NButton>
          <NButton
            type="primary"
            size="small"
            :loading="saving"
            :disabled="!editorStore.isDirty"
            @click="save"
          >
            {{ t("editor.save") }}
          </NButton>
        </NSpace>
      </header>

      <main class="editor-content">
        <AimdEditor
          :key="editorStore.filePath ?? undefined"
          :model-value="fileContent"
          mode="source"
          :show-toolbar="true"
          :show-aimd-toolbar="true"
          :show-md-toolbar="true"
          :min-height="0"
          @update:model-value="handleContentChange"
        />
      </main>
    </template>

    <!-- New file modal -->
    <NModal
      v-model:show="showNewFileModal"
      preset="card"
      :title="t('editor.newFile')"
      style="width: 400px"
      :mask-closable="false"
    >
      <NInput
        v-model:value="newFileName"
        :placeholder="t('editor.fileNamePlaceholder')"
        autofocus
        @keyup.enter="createNewFile"
      />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showNewFileModal = false">{{ t("common.cancel") }}</NButton>
          <NButton type="primary" :loading="creatingFile" @click="createNewFile">
            {{ t("common.confirm") }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.editor-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.center-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--aimd-border-color);
  flex-shrink: 0;
  background: var(--aimd-bg-card);
}

.project-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--aimd-text-primary);
}

.sep {
  color: var(--aimd-text-secondary);
}

.file-name {
  font-size: 14px;
  color: var(--aimd-text-secondary);
}

.dirty-indicator {
  color: var(--aimd-color-primary);
  font-size: 18px;
  line-height: 1;
}

.editor-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-content :deep(.aimd-editor) {
  height: 100%;
  border: none;
  border-radius: 0;
}

.editor-content :deep(.aimd-editor-panel) {
  flex: 1;
  min-height: 0;
}

.editor-content :deep(.aimd-editor-source-mode) {
  height: 100%;
}

.editor-content :deep(.aimd-editor-container) {
  height: 100%;
}
</style>
