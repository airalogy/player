import { invoke } from "@tauri-apps/api/core"
import type { CloneVarCardPayload, VarCardManifest } from "./types"

export async function listUserVarCards(): Promise<VarCardManifest[]> {
  return invoke<VarCardManifest[]>("list_var_cards")
}

export async function getUserVarCard(id: string): Promise<VarCardManifest> {
  return invoke<VarCardManifest>("get_var_card", { id })
}

export async function cloneVarCard(payload: CloneVarCardPayload): Promise<VarCardManifest> {
  return invoke<VarCardManifest>("clone_var_card", {
    sourceManifest: payload.sourceManifest,
    newId: payload.newId,
  })
}

export async function saveUserVarCard(manifest: VarCardManifest): Promise<VarCardManifest> {
  return invoke<VarCardManifest>("save_var_card", { manifest })
}

export async function deleteUserVarCard(id: string): Promise<void> {
  return invoke("delete_var_card", { id })
}
