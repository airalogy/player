<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { NButton, NSpace, NSelect, NSpin, NEmpty } from "naive-ui"
import { AimdRecorder, createEmptyProtocolRecordData } from "@airalogy/aimd-recorder"
import "@airalogy/aimd-recorder/styles"
import type { AimdProtocolRecordData } from "@airalogy/aimd-recorder"
import { useProjectStore } from "@/stores/project"
import { invoke } from "@tauri-apps/api/core"

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const projectStore = useProjectStore()

type Status = "loading" | "no-project" | "no-files" | "ready"

const status = ref<Status>("loading")
const files = ref<string[]>([])
const selectedFile = ref<string | null>(null)
const content = ref("")
const record = ref<AimdProtocolRecordData>(createEmptyProtocolRecordData())

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
    content.value = `# ${project.name}\n\n${project.description || ""}`
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
  content.value = await invoke<string>("read_file", { path })
  selectedFile.value = filename
  router.replace({ query: { ...route.query, file: filename } })
}

async function handleFileSwitch(filename: string) {
  const project = projectStore.currentProject
  if (project) await openFile(project.path, filename)
}

function openEditor() {
  const query: Record<string, string> = { project: projectId.value! }
  if (selectedFile.value) query.file = selectedFile.value
  router.push({ path: "/editor", query })
}

function goBack() {
  router.push("/projects")
}

onMounted(load)
watch(projectId, (newId, oldId) => {
  if (newId !== oldId) load()
})
</script>

<template>
  <div class="protocol-page">
    <!-- Loading -->
    <div v-if="status === 'loading'" class="center-state">
      <NSpin size="large" />
    </div>

    <!-- No project -->
    <div v-else-if="status === 'no-project'" class="center-state">
      <NEmpty :description="t('editor.noProject')">
        <template #extra>
          <NButton type="primary" @click="router.push('/projects')">
            {{ t("nav.projects") }}
          </NButton>
        </template>
      </NEmpty>
    </div>

    <!-- Has project but no files -->
    <template v-else-if="status === 'no-files'">
      <header class="protocol-header">
        <NSpace align="center" :size="8">
          <NButton quaternary circle @click="goBack">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </template>
          </NButton>
          <h2 class="protocol-title">{{ projectStore.currentProject?.name }}</h2>
        </NSpace>
        <NButton type="primary" @click="openEditor">{{ t("editor.title") }}</NButton>
      </header>
      <div class="center-state">
        <NEmpty :description="t('editor.noFiles')">
          <template #extra>
            <NButton type="primary" @click="openEditor">
              {{ t("editor.newFile") }}
            </NButton>
          </template>
        </NEmpty>
      </div>
    </template>

    <!-- Ready -->
    <template v-else>
      <header class="protocol-header">
        <NSpace align="center" :size="8">
          <NButton quaternary circle @click="goBack">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </template>
          </NButton>
          <h2 class="protocol-title">{{ projectStore.currentProject?.name }}</h2>
          <template v-if="files.length > 1">
            <span class="sep">/</span>
            <NSelect
              :value="selectedFile"
              :options="fileSelectOptions"
              size="small"
              style="width: 200px"
              @update:value="handleFileSwitch"
            />
          </template>
        </NSpace>
        <NButton @click="openEditor">{{ t("editor.title") }}</NButton>
      </header>

      <main class="protocol-content">
        <AimdRecorder
          v-model="record"
          :content="content"
          locale="en-US"
        />
      </main>
    </template>
  </div>
</template>

<style scoped>
.protocol-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--aimd-bg-page);
}

.center-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.protocol-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid var(--aimd-border-color);
  flex-shrink: 0;
}

.protocol-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--aimd-text-primary);
}

.sep {
  color: var(--aimd-text-secondary);
}

.protocol-content {
  flex: 1;
  overflow: auto;
}
</style>
