import { createApp } from "vue"
import { createPinia } from "pinia"
import { createI18n } from "vue-i18n"
import naive from "naive-ui"
import App from "./App.vue"
import router from "./router"
import en from "./locales/en.json"
import zh from "./locales/zh.json"
import { useVarCardStore } from "./stores/varCards"
import "./styles/main.css"

const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: { en, zh },
})

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(naive)

void useVarCardStore(pinia).fetchCards()

app.mount("#app")
