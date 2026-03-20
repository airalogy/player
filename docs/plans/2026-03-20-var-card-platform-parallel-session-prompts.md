# Var Card Platform Parallel Session Prompts

Use these prompts in separate sessions after sharing the main plan:

- Main plan: `aimdlab/docs/plans/2026-03-20-var-card-platform-implementation-plan.md`
- Repo root: `/Users/xiayh/Projects/player-dev`
- App root: `/Users/xiayh/Projects/player-dev/aimdlab`

All sessions should follow these global rules:

1. Read the main plan first.
2. You are not alone in the codebase. Do not revert or overwrite other sessions' work.
3. Stay inside your assigned write scope.
4. If another session changed a touched file, integrate with that change instead of reverting it.
5. Before finishing, run the narrowest relevant verification command and report what you changed.

## Session 1: Registry Backend + Frontend Store

**Prompt**

You are implementing Session 1 from `aimdlab/docs/plans/2026-03-20-var-card-platform-implementation-plan.md`.

Goal:
- Build the Var Card registry data path from Tauri commands to a frontend Pinia store.

Required reading:
- `aimdlab/docs/plans/2026-03-20-var-card-platform-implementation-plan.md`
- `aimdlab/src-tauri/src/commands/file.rs`
- `aimdlab/src-tauri/src/commands/workspace.rs`
- `aimdlab/src/stores/workspace.ts`

Write scope:
- `aimdlab/src-tauri/src/commands/var_cards.rs`
- `aimdlab/src-tauri/src/commands/mod.rs`
- `aimdlab/src-tauri/src/main.rs`
- `aimdlab/src/features/var-cards/types.ts`
- `aimdlab/src/features/var-cards/builtin.ts`
- `aimdlab/src/features/var-cards/api.ts`
- `aimdlab/src/stores/varCards.ts`
- `aimdlab/src/main.ts`

Do not edit:
- `aimdlab/src/pages/ProtocolView.vue`
- `aimdlab/src/pages/EditorPage.vue`
- `aimdlab/src/pages/VarCardMarketPage.vue`
- `aimdlab/src/pages/VarCardStudioPage.vue`
- `aimdlab/src/components/var-cards/**`

Implementation requirements:
- Use app data directory for user card persistence.
- Built-in cards should be represented in frontend constants, not persisted by Rust.
- Tauri commands must support list/get/clone/save/delete for user cards.
- Pinia store must merge built-in cards with persisted user cards.
- Keep types explicit and serializable.

Verification:
- `cd /Users/xiayh/Projects/player-dev/aimdlab && pnpm run type-check`
- `cd /Users/xiayh/Projects/player-dev/aimdlab/src-tauri && cargo check`

Final response must include:
- Files changed
- Commands run
- Remaining risks or assumptions

## Session 2: Card Runtime + Recorder Integration

**Prompt**

You are implementing Session 2 from `aimdlab/docs/plans/2026-03-20-var-card-platform-implementation-plan.md`.

Goal:
- Build the card runtime compiler and make `ProtocolView` feed card-backed type plugins into `AimdRecorder`.

Required reading:
- `aimdlab/docs/plans/2026-03-20-var-card-platform-implementation-plan.md`
- `packages/aimd-recorder/src/components/AimdRecorder.vue`
- `packages/aimd-recorder/src/types.ts`
- `packages/aimd-recorder/src/type-plugins.ts`
- `aimdlab/src/pages/ProtocolView.vue`

Write scope:
- `aimdlab/src/features/var-cards/runtime/compileCardManifest.ts`
- `aimdlab/src/features/var-cards/runtime/createVarCardRuntime.ts`
- `aimdlab/src/features/var-cards/runtime/renderVarCardPreview.ts`
- `aimdlab/src/features/var-cards/runtime/createRecorderTypePlugins.ts`
- `aimdlab/src/components/var-cards/VarCardShell.vue`
- `aimdlab/src/components/var-cards/VarCardPreviewSurface.vue`
- `aimdlab/src/composables/useVarCardRecorder.ts`
- `aimdlab/src/pages/ProtocolView.vue`

Do not edit:
- Tauri command files
- market/studio route files
- `aimdlab/src/router/index.ts`
- `aimdlab/src/App.vue`
- `aimdlab/src/pages/EditorPage.vue`

Implementation requirements:
- Runtime must compile manifest data into recorder-compatible type plugins.
- Use one shared shell for preview and Record field-body rendering.
- Preserve existing built-in behavior where possible.
- If Session 1 types/store are in flux, adapt to them rather than replacing them.

Verification:
- `cd /Users/xiayh/Projects/player-dev/aimdlab && pnpm run type-check`

Manual note:
- Document how the bridge expects card manifests to describe field-body layout and behavior.

Final response must include:
- Files changed
- Commands run
- Remaining risks or assumptions

## Session 3: Market Route + Gallery + Preview Dialog

**Prompt**

You are implementing Session 3 from `aimdlab/docs/plans/2026-03-20-var-card-platform-implementation-plan.md`.

Goal:
- Add the Var Card Market page, gallery layout, and real preview dialog wired to the shared store/runtime.

Required reading:
- `aimdlab/docs/plans/2026-03-20-var-card-platform-implementation-plan.md`
- `aimdlab/src/router/index.ts`
- `aimdlab/src/App.vue`
- `aimdlab/src/pages/ProjectListPage.vue`
- `aimdlab/src/pages/SettingsPage.vue`

Write scope:
- `aimdlab/src/pages/VarCardMarketPage.vue`
- `aimdlab/src/components/var-cards/VarCardGallery.vue`
- `aimdlab/src/components/var-cards/VarCardGalleryItem.vue`
- `aimdlab/src/components/var-cards/VarCardPreviewDialog.vue`
- `aimdlab/src/router/index.ts`
- `aimdlab/src/App.vue`
- `aimdlab/src/locales/en.json`
- `aimdlab/src/locales/zh.json`

Do not edit:
- Tauri command files
- runtime compiler files
- `aimdlab/src/pages/ProtocolView.vue`
- `aimdlab/src/pages/EditorPage.vue`
- studio files

Implementation requirements:
- Add a top-level nav entry for Var Cards.
- Gallery should read from store and feel like a card marketplace, not a list view.
- Preview dialog must use the shared runtime preview surface if already available; if Session 2 has not landed yet, integrate without replacing its files.
- Built-in cards show Clone action, not direct edit.

Verification:
- `cd /Users/xiayh/Projects/player-dev/aimdlab && pnpm run type-check`

Final response must include:
- Files changed
- Commands run
- Remaining risks or assumptions

## Session 4: Card Studio + Editor Bridge

**Prompt**

You are implementing Session 4 from `aimdlab/docs/plans/2026-03-20-var-card-platform-implementation-plan.md`.

Goal:
- Add the Card Studio editing flow and integrate card types into the AIMD editor insertion path.

Required reading:
- `aimdlab/docs/plans/2026-03-20-var-card-platform-implementation-plan.md`
- `aimdlab/src/pages/EditorPage.vue`
- `packages/aimd-editor/src/vue/AimdEditor.vue`
- `packages/aimd-editor/src/vue/types.ts`

Write scope:
- `aimdlab/src/pages/VarCardStudioPage.vue`
- `aimdlab/src/components/var-cards/studio/VarCardStudioLayout.vue`
- `aimdlab/src/components/var-cards/studio/VarCardFormPanel.vue`
- `aimdlab/src/components/var-cards/studio/VarCardLivePreviewPanel.vue`
- `aimdlab/src/components/var-cards/studio/VarCardBehaviorPanel.vue`
- `aimdlab/src/features/var-cards/runtime/createEditorVarTypePresets.ts`
- `aimdlab/src/pages/EditorPage.vue`
- `aimdlab/src/router/index.ts`
- `aimdlab/src/locales/en.json`
- `aimdlab/src/locales/zh.json`

Do not edit:
- Tauri command files
- `aimdlab/src/pages/ProtocolView.vue`
- recorder runtime compiler files
- gallery files owned by Session 3 except to integrate additive route wiring if necessary

Implementation requirements:
- Built-in cards open as read-only with Clone CTA.
- User cards can be edited and saved through the store.
- Editor must expose card presets with friendly labels while writing stable `recordType` tokens into AIMD.
- If route conflicts occur with Session 3, merge carefully instead of reverting.

Verification:
- `cd /Users/xiayh/Projects/player-dev/aimdlab && pnpm run type-check`

Final response must include:
- Files changed
- Commands run
- Remaining risks or assumptions

## Recommended Merge Order

1. Session 1
2. Session 2
3. Session 3
4. Session 4

If all sessions run truly in parallel, integrate in that order and resolve route/store/runtime touchpoints before UI polish.
