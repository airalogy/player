import { createRouter, createWebHistory } from "vue-router"

const marketPageLoaders = import.meta.glob("../pages/VarCardMarketPage.vue")
const marketPageLoader =
  marketPageLoaders["../pages/VarCardMarketPage.vue"] ??
  (() => import("@/pages/WelcomePage.vue"))

const studioPageLoaders = import.meta.glob("../pages/VarCardStudioPage.vue")
const studioPageLoader =
  studioPageLoaders["../pages/VarCardStudioPage.vue"] ??
  (() => import("@/pages/WelcomePage.vue"))

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
      path: "/var-cards",
      name: "var-cards",
      component: marketPageLoader,
    },
    {
      path: "/var-cards/studio",
      name: "var-card-studio",
      component: studioPageLoader,
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("@/pages/SettingsPage.vue"),
    },
  ],
})

export default router
