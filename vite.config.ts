import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import tsconfigPaths from "vite-tsconfig-paths"
import monacoEditorPlugin from "vite-plugin-monaco-editor"
import { resolve } from "path"

const host = process.env.TAURI_DEV_HOST

export default defineConfig(async () => ({
  plugins: [
    vue(),
    tsconfigPaths(),
    (monacoEditorPlugin as any).default({
      languageWorkers: ["editorWorkerService", "css", "html", "json", "typescript"],
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@airalogy/aimd-editor/vue": resolve(__dirname, "../packages/aimd-editor/src/vue/index.ts"),
      "@airalogy/aimd-editor/embedded": resolve(__dirname, "../packages/aimd-editor/src/embedded.ts"),
      "@airalogy/aimd-editor/wysiwyg": resolve(__dirname, "../packages/aimd-editor/src/wysiwyg.ts"),
      "@airalogy/aimd-editor/monaco": resolve(__dirname, "../packages/aimd-editor/src/monaco.ts"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  optimizeDeps: {
    include: ["monaco-editor"],
  },
}))
