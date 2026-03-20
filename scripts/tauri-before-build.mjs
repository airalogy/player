import { readdir, rm } from "node:fs/promises"
import { spawn } from "node:child_process"
import { resolve } from "node:path"

const projectRoot = process.cwd()
const macosBundleDir = resolve(projectRoot, "src-tauri/target/release/bundle/macos")

const removableEntry = (name) =>
  name === ".DS_Store" ||
  name.endsWith(".app") ||
  name.endsWith(".dmg") ||
  name.startsWith("rw.")

async function cleanMacosBundleDir() {
  let entries

  try {
    entries = await readdir(macosBundleDir, { withFileTypes: true })
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return
    }

    throw error
  }

  await Promise.all(
    entries
      .filter((entry) => removableEntry(entry.name))
      .map((entry) => rm(resolve(macosBundleDir, entry.name), { recursive: true, force: true })),
  )
}

function runFrontendBuild() {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("pnpm", ["build"], {
      cwd: projectRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
    })

    child.on("error", rejectPromise)
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      rejectPromise(new Error(`pnpm build exited with code ${code ?? "unknown"}`))
    })
  })
}

await cleanMacosBundleDir()
await runFrontendBuild()
