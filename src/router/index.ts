import { createRouter, createWebHistory } from "vue-router"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "welcome",
      component: () => import("@/pages/WelcomePage.vue"),
    },
    {
      path: "/projects",
      name: "projects",
      component: () => import("@/pages/ProjectListPage.vue"),
    },
    {
      path: "/protocol",
      name: "protocol",
      component: () => import("@/pages/ProtocolView.vue"),
    },
    {
      path: "/editor",
      name: "editor",
      component: () => import("@/pages/EditorPage.vue"),
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("@/pages/SettingsPage.vue"),
    },
  ],
})

export default router
