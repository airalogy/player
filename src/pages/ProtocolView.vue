<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { NButton, NSpace, NSelect, NSpin, NEmpty } from "naive-ui"
import { AimdRecorder, createEmptyProtocolRecordData } from "@airalogy/aimd-recorder"
import "@airalogy/aimd-recorder/styles"
import type { AimdProtocolRecordData } from "@airalogy/aimd-recorder"
import { useWorkspaceStore } from "@/stores/workspace"
import { invoke } from "@tauri-apps/api/core"

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const workspaceStore = useWorkspaceStore()

type Status = "loading" | "no-workspace" | "no-protocol" | "no-files" | "ready"

const status = ref<Status>("loading")
const files = ref<string[]>([])
const selectedFile = ref<string | null>(null)
const content = ref("")
const record = ref<AimdProtocolRecordData>(createEmptyProtocolRecordData())

const protocolId = computed(() => route.query.id as string | undefined)

const protocol = computed(() =>
  workspaceStore.current?.protocols.find((p) => p.id === protocolId.value) ?? null
)

const fileSelectOptions = computed(() =>
  files.value.map((f) => ({ label: f, value: f }))
)

async function load() {
  if (!workspaceStore.current) {
    status.value = "no-workspace"
    return
  }
  if (!protocol.value) {
    status.value = "no-protocol"
    return
  }

  status.value = "loading"

  if (protocol.value.type === "file") {
    // single-file protocol — read directly
    content.value = await invoke<string>("read_file", { path: protocol.value.path })
    files.value = [protocol.value.path.split("/").pop()!]
    selectedFile.value = files.value[0]
    status.value = "ready"
  } else {
    // folder protocol — list .aimd files inside
    const entries: { name: string; is_dir: boolean }[] = await invoke("list_files", {
      dir: protocol.value.path,
    })
    files.value = entries.filter((f) => !f.is_dir && f.name.endsWith(".aimd")).map((f) => f.name)

    if (files.value.length === 0) {
      status.value = "no-files"
      return
    }

    const target = files.value[0]
    await openFile(target)
    status.value = "ready"
  }
}

async function openFile(filename: string) {
  if (!protocol.value) return
  const path =
    protocol.value.type === "file"
      ? protocol.value.path
      : `${protocol.value.path}/${filename}`
  content.value = await invoke<string>("read_file", { path })
  selectedFile.value = filename
}

async function handleFileSwitch(filename: string) {
  await openFile(filename)
}

function openEditor() {
  if (!protocolId.value) return
  router.push({ path: "/editor", query: { id: protocolId.value } })
}

onMounted(load)
watch(protocolId, (newId, oldId) => { if (newId !== oldId) load() })
</script>

<template>
  <div class="protocol-page">
    <div v-if="status === 'loading'" class="center-state">
      <NSpin size="large" />
    </div>

    <div v-else-if="status === 'no-workspace' || status === 'no-protocol'" class="center-state">
      <NEmpty :description="t('editor.noProject')">
        <template #extra>
          <NButton type="primary" @click="router.push('/projects')">
            {{ t("nav.projects") }}
          </NButton>
        </template>
      </NEmpty>
    </div>

    <template v-else-if="status === 'no-files'">
      <header class="protocol-header">
        <NSpace align="center" :size="8">
          <NButton quaternary circle @click="router.push('/projects')">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </template>
          </NButton>
          <h2 class="protocol-title">{{ protocol?.name }}</h2>
        </NSpace>
        <NButton type="primary" @click="openEditor">{{ t("editor.title") }}</NButton>
      </header>
      <div class="center-state">
        <NEmpty :description="t('editor.noFiles')">
          <template #extra>
            <NButton type="primary" @click="openEditor">{{ t("editor.newFile") }}</NButton>
          </template>
        </NEmpty>
      </div>
    </template>

    <template v-else>
      <header class="protocol-header">
        <NSpace align="center" :size="8">
          <NButton quaternary circle @click="router.push('/projects')">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </template>
          </NButton>
          <h2 class="protocol-title">{{ protocol?.name }}</h2>
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
        <AimdRecorder v-model="record" :content="content" locale="en-US" />
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
