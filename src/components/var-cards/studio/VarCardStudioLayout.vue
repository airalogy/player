<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="studio-layout">
    <header class="studio-header">
      <div>
        <h1 class="studio-title">{{ title }}</h1>
        <p v-if="subtitle" class="studio-subtitle">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </header>

    <div class="studio-grid">
      <section class="studio-main">
        <slot name="form" />
        <slot name="behavior" />
      </section>

      <aside class="studio-preview">
        <slot name="preview" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.studio-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100%;
}

.studio-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.studio-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--aimd-text-primary);
}

.studio-subtitle {
  margin: 8px 0 0;
  color: var(--aimd-text-secondary);
  max-width: 720px;
  line-height: 1.5;
}

.studio-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
  gap: 20px;
  align-items: start;
}

.studio-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.studio-preview {
  position: sticky;
  top: 24px;
}

@media (max-width: 1080px) {
  .studio-grid {
    grid-template-columns: 1fr;
  }

  .studio-preview {
    position: static;
  }
}

@media (max-width: 640px) {
  .studio-header {
    flex-direction: column;
  }
}
</style>
