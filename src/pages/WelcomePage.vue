<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { NButton, NSpace, NEmpty } from "naive-ui"
import { useProjectStore } from "@/stores/project"
import type { Project } from "@/stores/project"

const router = useRouter()
const { t } = useI18n()
const projectStore = useProjectStore()

const recentProjects = ref<Project[]>([])
const loading = ref(true)

onMounted(async () => {
  projectStore.fetchProjects().finally(() => {
    recentProjects.value = projectStore.projects.slice(0, 6)
    loading.value = false
  })
})

function openProject(project: Project) {
  projectStore.setCurrentProject(project)
  router.push(`/protocol?project=${project.id}`)
}

function goToProjects() {
  router.push("/projects")
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString()
}
</script>

<template>
  <div class="welcome-page">
    <header class="welcome-header">
      <h1 class="welcome-title">{{ t("welcome.title") }}</h1>
      <p class="welcome-subtitle">{{ t("welcome.subtitle") }}</p>
    </header>

    <main class="welcome-main">
      <NSpace vertical :size="24" class="action-buttons">
        <NButton type="primary" size="large" @click="goToProjects">
          {{ t("welcome.newProject") }}
        </NButton>
        <NButton size="large" @click="goToProjects">
          {{ t("welcome.openProject") }}
        </NButton>
      </NSpace>

      <section class="recent-files">
        <h2 class="section-title">{{ t("welcome.recentFiles") }}</h2>
        <div v-if="recentProjects.length > 0" class="recent-grid">
          <div
            v-for="project in recentProjects"
            :key="project.id"
            class="recent-card"
            @click="openProject(project)"
          >
            <div class="recent-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div class="recent-card-info">
              <h3 class="recent-card-name">{{ project.name }}</h3>
              <p class="recent-card-date">{{ formatDate(project.updated_at) }}</p>
            </div>
          </div>
        </div>
        <NEmpty v-else :description="t('welcome.noRecentFiles')" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.welcome-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 24px;
  background: linear-gradient(
    135deg,
    rgba(26, 115, 232, 0.08) 0%,
    transparent 50%
  );
}

.welcome-header {
  text-align: center;
  margin-bottom: 48px;
}

.welcome-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--aimd-text-primary);
  margin-bottom: 12px;
}

.welcome-subtitle {
  font-size: 18px;
  color: var(--aimd-text-secondary);
}

.welcome-main {
  width: 100%;
  max-width: 600px;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--aimd-text-secondary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--aimd-border-color);
}

.recent-files {
  margin-top: 48px;
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.recent-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--aimd-bg-card);
  border: 1px solid var(--aimd-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recent-card:hover {
  border-color: var(--aimd-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recent-card-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--aimd-bg-page);
  border-radius: 8px;
  color: var(--aimd-color-primary);
}

.recent-card-info {
  min-width: 0;
}

.recent-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--aimd-text-primary);
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-card-date {
  font-size: 12px;
  color: var(--aimd-text-secondary);
  margin: 0;
}
</style>
