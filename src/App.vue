<script setup lang="ts">
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { NLayout, NLayoutSider, NLayoutContent, NMenu, NMessageProvider, NDialogProvider, NNotificationProvider } from "naive-ui"
import { useWorkspaceStore } from "@/stores/workspace"

const route = useRoute()
const router = useRouter()
const workspaceStore = useWorkspaceStore()

const menuOptions = [
  {
    label: "Welcome",
    key: "welcome",
    onClick: () => router.push("/"),
  },
  {
    label: "Projects",
    key: "projects",
    onClick: () => router.push("/projects"),
  },
  {
    label: "Editor",
    key: "editor",
    onClick: () => {
      const ws = workspaceStore.current
      if (ws) {
        router.push({ path: "/editor", query: { workspace: ws.path } })
      } else {
        router.push("/projects")
      }
    },
  },
  {
    label: "Settings",
    key: "settings",
    onClick: () => router.push("/settings"),
  },
]

const activeKey = computed(() => {
  const path = route.path
  if (path === "/") return "welcome"
  if (path.startsWith("/projects")) return "projects"
  if (path.startsWith("/protocol")) return "projects"
  if (path.startsWith("/editor")) return "editor"
  if (path.startsWith("/settings")) return "settings"
  return "welcome"
})

function handleMenuUpdate(key: string) {
  const option = menuOptions.find((o) => o.key === key)
  if (option?.onClick) option.onClick()
}
</script>

<template>
  <NNotificationProvider>
    <NDialogProvider>
      <NMessageProvider>
        <NLayout has-sider style="height: 100vh">
          <NLayoutSider
            bordered
            :width="200"
            :native-scrollbar="false"
            style="background: var(--aimd-bg-card)"
          >
            <div class="app-logo">
              <h1 class="logo-text">AimdLab</h1>
            </div>
            <NMenu :value="activeKey" :options="menuOptions" @update:value="handleMenuUpdate" />
          </NLayoutSider>

          <NLayoutContent
            style="background: var(--aimd-bg-page); height: 100vh; overflow: hidden;"
          >
            <router-view />
          </NLayoutContent>
        </NLayout>
      </NMessageProvider>
    </NDialogProvider>
  </NNotificationProvider>
</template>

<style scoped>
.app-logo {
  padding: 20px 16px;
  border-bottom: 1px solid var(--aimd-border-color);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--aimd-color-primary);
  margin: 0;
}
</style>
