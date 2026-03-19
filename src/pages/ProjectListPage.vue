<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { NButton, NEmpty, NInput, NModal, NCard, NSpace, NTag, useMessage } from "naive-ui"
import { useProjectStore } from "@/stores/project"
import type { Project } from "@/stores/project"

const router = useRouter()
const { t } = useI18n()
const message = useMessage()
const projectStore = useProjectStore()

const searchQuery = ref("")
const showCreateModal = ref(false)
const newProjectName = ref("")
const newProjectDescription = ref("")
const creating = ref(false)

onMounted(async () => {
  await projectStore.fetchProjects()
})

const filteredProjects = computed<Project[]>(() => {
  const projects = projectStore.projects
  if (!searchQuery.value) {
    return [...projects]
  }
  const query = searchQuery.value.toLowerCase()
  return projects.filter(
    (p: Project) =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
  )
})

watch(searchQuery, () => {
  // Trigger reactivity by reading filteredProjects (computed auto-tracks)
})

async function createProject() {
  if (!newProjectName.value.trim()) {
    message.warning(t("projects.nameRequired"))
    return
  }

  creating.value = true
  try {
    const project = await projectStore.createProject(
      newProjectName.value.trim(),
      newProjectDescription.value.trim()
    )
    if (project) {
      message.success(t("projects.created"))
      showCreateModal.value = false
      newProjectName.value = ""
      newProjectDescription.value = ""
      openProject(project)
    }
  } catch (e) {
    message.error(t("projects.createFailed"))
  } finally {
    creating.value = false
  }
}

function openProject(project: Project) {
  projectStore.setCurrentProject(project)
  router.push(`/protocol?project=${project.id}`)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString()
}
</script>

<template>
  <div class="projects-page">
    <header class="page-header">
      <h1 class="page-title">{{ t("nav.projects") }}</h1>
      <NButton type="primary" @click="showCreateModal = true">
        {{ t("welcome.newProject") }}
      </NButton>
    </header>

    <div class="search-bar">
      <NInput
        v-model:value="searchQuery"
        :placeholder="t('projects.search')"
        clearable
      />
    </div>

    <main class="projects-content">
      <div v-if="projectStore.loading" class="loading-state">
        <span>{{ t("common.loading") }}</span>
      </div>

      <div v-else-if="filteredProjects.length === 0" class="empty-state">
        <NEmpty :description="t('projects.noProjects')">
          <template #extra>
            <NButton type="primary" @click="showCreateModal = true">
              {{ t("projects.createFirst") }}
            </NButton>
          </template>
        </NEmpty>
      </div>

      <div v-else class="projects-grid">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="project-card"
          @click="openProject(project)"
        >
          <div class="project-card-header">
            <h3 class="project-name">{{ project.name }}</h3>
            <NTag v-if="project.starred" type="warning" size="small">
              {{ t("projects.starred") }}
            </NTag>
          </div>
          <p class="project-description">
            {{ project.description || t("projects.noDescription") }}
          </p>
          <div class="project-meta">
            <span class="project-date">{{ formatDate(project.updated_at) }}</span>
            <div v-if="project.tags.length > 0" class="project-tags">
              <NTag
                v-for="tag in project.tags.slice(0, 3)"
                :key="tag"
                size="small"
                :bordered="false"
              >
                {{ tag }}
              </NTag>
            </div>
          </div>
        </div>
      </div>
    </main>

    <NModal
      v-model:show="showCreateModal"
      preset="card"
      :title="t('projects.createTitle')"
      style="width: 500px"
      :mask-closable="false"
    >
      <NSpace vertical :size="20">
        <div class="form-item">
          <label class="form-label">{{ t("projects.projectName") }} *</label>
          <NInput
            v-model:value="newProjectName"
            :placeholder="t('projects.namePlaceholder')"
            autofocus
            @keyup.enter="createProject"
          />
        </div>
        <div class="form-item">
          <label class="form-label">{{ t("projects.description") }}</label>
          <NInput
            v-model:value="newProjectDescription"
            type="textarea"
            :placeholder='t("projects.descriptionPlaceholder")'
            :rows="3"
          />
        </div>
      </NSpace>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCreateModal = false">{{ t("common.cancel") }}</NButton>
          <NButton type="primary" :loading="creating" @click="createProject">
            {{ t("common.confirm") }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.projects-page {
  min-height: 100vh;
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
}

.search-bar {
  max-width: 400px;
  margin-bottom: 24px;
}

.projects-content {
  background: var(--aimd-bg-card);
  border-radius: 12px;
  padding: 24px;
  min-height: 400px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.project-card {
  background: var(--aimd-bg-page);
  border: 1px solid var(--aimd-border-color);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-card:hover {
  border-color: var(--aimd-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--aimd-text-primary);
}

.project-description {
  font-size: 14px;
  color: var(--aimd-text-secondary);
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-date {
  font-size: 12px;
  color: var(--aimd-text-secondary);
}

.project-tags {
  display: flex;
  gap: 4px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--aimd-text-primary);
}
</style>
