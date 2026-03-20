# Var Card Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a user-extensible Var Card Platform for AIMD Record UI, including a card market, real previews, clone-only customization for built-ins, and runtime rendering in `AimdRecorder`.

**Architecture:** Keep `AimdRecorder` as the unified Record shell and add a declarative card registry above it. Card definitions are stored as user-editable manifests in app data, compiled in the frontend into a stable runtime adapter that feeds existing `typePlugins`, `fieldMeta`, and preview surfaces. The same runtime powers market thumbnails, detail previews, studio previews, and Record rendering so user expectations stay aligned.

**Tech Stack:** Tauri 2, Rust command handlers, Vue 3, Pinia, Vue Router, Naive UI, existing `@airalogy/aimd-recorder` / `@airalogy/aimd-editor` extension points.

---

## Requirements Summary

### Functional

1. Add a standalone Var Card Market page that lists built-in and user cards as compact preview cards.
2. Add a real preview dialog/drawer that renders each card with demo data using the same runtime used by Record.
3. Add clone-only editing for built-in cards.
4. Add a Card Studio for editing cloned cards without raw Vue component authoring.
5. Make user cards available to Record UI when a protocol references the card type.
6. Keep a stable way to reference cards from AIMD var declarations.
7. Preserve built-in AIMD types and existing Record behavior during rollout.

### Non-Functional

1. No arbitrary JS/Vue execution in v1.
2. One source of truth for card manifests on disk.
3. Stable runtime contract between card registry and Record UI.
4. Non-destructive evolution path for built-in cards.
5. No coupling between card preview implementation and Record-only DOM structure.

## Recommended Architecture

```text
App Data
  cards/
    builtin/<card-id>/manifest.json
    builtin/<card-id>/demo.json
    user/<card-id>/manifest.json
    user/<card-id>/demo.json

Rust Commands
  list_var_cards
  get_var_card
  clone_var_card
  save_var_card
  delete_var_card

Frontend Store
  useVarCardStore()
    -> loads manifests
    -> normalizes records
    -> exposes gallery + studio actions

Card Runtime Layer
  manifest -> compiled runtime
    -> renderPreview()
    -> renderField()
    -> getInitialValue()
    -> normalizeValue()
    -> parseInputValue()
    -> getDisplayValue()

UI Surfaces
  VarCardMarketPage
  VarCardPreviewDialog
  VarCardStudioPage
  AimdRecorder bridge
  AimdEditor card type picker bridge
```

## ADRs

### ADR-001: Use declarative manifests, not executable UI plugins

- Decision: v1 card customization uses JSON-backed declarative manifests compiled to runtime adapters.
- Why: keeps previews deterministic, avoids code execution risk, preserves uniform Record shell behavior.
- Trade-off: less expressive than arbitrary Vue components; advanced behaviors must be added to schema deliberately.

### ADR-002: Keep `AimdRecorder` as unified shell

- Decision: custom cards control field-body rendering, but host app owns outer shell, status, validation, action areas, and layout rhythm.
- Why: prevents Record UI fragmentation and keeps later interaction redesign feasible.
- Trade-off: some highly custom cards may feel constrained; this is acceptable in v1.

### ADR-003: File-backed registry is source of truth

- Decision: store card manifests under app data, not in SQLite as canonical storage.
- Why: easier import/export/debugging, simpler Tauri implementation, aligns with user-owned assets.
- Trade-off: metadata search is less sophisticated; acceptable for v1 scale.

### ADR-004: Use stable namespaced card type IDs

- Decision: protocol vars reference cards by stable card type token such as `card:builtin/current-time` or `card:user/ph-buffer-v1`.
- Why: runtime lookup becomes deterministic and cards can coexist with built-in AIMD scalar types.
- Trade-off: editor UX must expose friendly labels for these IDs.

## Data Model

Create a shared frontend model first. Keep it explicit and versioned.

```ts
export type VarCardNamespace = "builtin" | "user"

export interface VarCardManifest {
  id: string
  namespace: VarCardNamespace
  version: string
  title: string
  description: string
  icon?: string
  tags: string[]
  readonly: boolean
  baseCardId?: string | null
  recordType: string
  demoValue: unknown
  schema: VarCardSchema
  layout: VarCardLayout
  appearance: VarCardAppearance
  behavior: VarCardBehavior
}
```

`recordType` is the token used by AIMD var declarations. The runtime must be able to map `recordType` to a manifest quickly.

## Rollout Strategy

### Phase 1

- Card registry storage and store.
- Built-in card manifests that mirror current recorder type plugins.
- Market page with gallery and real preview.

### Phase 2

- Card Studio clone/edit flow.
- Runtime compiler.
- `AimdRecorder` bridge that resolves card-backed types.

### Phase 3

- `AimdEditor` integration for card-backed var insertion.
- Polishing, import/export, validation messaging, example/demo cards.

## Task Breakdown

### Task 1: Shared Var Card Domain Model

**Files:**
- Create: `aimdlab/src/features/var-cards/types.ts`
- Create: `aimdlab/src/features/var-cards/builtin.ts`
- Create: `aimdlab/src/features/var-cards/runtime/compileCardManifest.ts`
- Modify: `aimdlab/src/pages/ProtocolView.vue`
- Modify: `aimdlab/src/pages/EditorPage.vue`

**Implementation notes:**
- Define all manifest/runtime/store types in one place.
- Encode built-in cards as manifests that match existing recorder behavior:
  - `CurrentTime`
  - `UserName`
  - `AiralogyMarkdown`
  - `DNASequence`
  - code-like types
- Add helpers:
  - `isVarCardType(type: string): boolean`
  - `toVarCardRecordType(namespace: string, slug: string): string`
  - `getBuiltinVarCardManifests(): VarCardManifest[]`

**Verification:**
- Run: `pnpm run type-check` in `aimdlab`
- Expected: no type errors after new feature module is added.

### Task 2: Tauri Card Registry Commands

**Files:**
- Create: `aimdlab/src-tauri/src/commands/var_cards.rs`
- Modify: `aimdlab/src-tauri/src/commands/mod.rs`
- Modify: `aimdlab/src-tauri/src/main.rs`

**Implementation notes:**
- Store user cards in app data under `cards/user/<id>/`.
- Materialize built-in cards from frontend or Rust constants; v1 recommendation: frontend constants + Rust only persists user cards.
- Commands:
  - `list_var_cards`
  - `get_var_card`
  - `clone_var_card`
  - `save_var_card`
  - `delete_var_card`
- `clone_var_card` must reject writes to built-in origin and always create a new user card.

**Verification:**
- Run: `cargo check`
- Expected: command module compiles cleanly and is registered in `main.rs`.

### Task 3: Frontend Var Card Store

**Files:**
- Create: `aimdlab/src/stores/varCards.ts`
- Create: `aimdlab/src/features/var-cards/api.ts`
- Modify: `aimdlab/src/main.ts`

**Implementation notes:**
- Centralize card loading and caching in a Pinia store.
- Merge built-in manifests with user manifests from Tauri.
- Expose:
  - `cards`
  - `cardsByRecordType`
  - `selectedCard`
  - `fetchCards()`
  - `openCard(id)`
  - `cloneCard(id)`
  - `saveCard(manifest)`
  - `deleteCard(id)`

**Verification:**
- Add basic store unit coverage if project test setup exists; otherwise verify by route-level manual smoke test.
- Run: `pnpm run type-check`

### Task 4: Card Runtime Compiler and Preview Renderer

**Files:**
- Create: `aimdlab/src/features/var-cards/runtime/createVarCardRuntime.ts`
- Create: `aimdlab/src/features/var-cards/runtime/renderVarCardPreview.ts`
- Create: `aimdlab/src/components/var-cards/VarCardPreviewSurface.vue`
- Create: `aimdlab/src/components/var-cards/VarCardShell.vue`

**Implementation notes:**
- Compile manifest schema into a runtime object compatible with recorder expectations.
- `renderField()` should return a Vue node for the field body only.
- `renderPreview()` should use the same compiled runtime, but with demo value and non-persistent state.
- Keep `VarCardShell` host-owned so preview and Record share visual structure.

**Verification:**
- Confirm preview for built-in card manifests matches current recorder behavior for text, number, checkbox, markdown, DNA, code.

### Task 5: Market Route and Gallery UI

**Files:**
- Create: `aimdlab/src/pages/VarCardMarketPage.vue`
- Create: `aimdlab/src/components/var-cards/VarCardGallery.vue`
- Create: `aimdlab/src/components/var-cards/VarCardGalleryItem.vue`
- Create: `aimdlab/src/components/var-cards/VarCardPreviewDialog.vue`
- Modify: `aimdlab/src/router/index.ts`
- Modify: `aimdlab/src/App.vue`
- Modify: `aimdlab/src/locales/en.json`
- Modify: `aimdlab/src/locales/zh.json`

**Implementation notes:**
- Add a new top-level route, e.g. `/var-cards`.
- Gallery cards should feel like a professional asset browser, not a table.
- Each card shows:
  - title
  - tags
  - built-in/user badge
  - small live preview
- Detail preview dialog shows real render and actions:
  - Preview
  - Clone
  - Edit (user cards only)

**Verification:**
- Manual smoke test in `pnpm tauri:dev`
- Confirm route navigation and preview dialog work without card-store race conditions.

### Task 6: Card Studio

**Files:**
- Create: `aimdlab/src/pages/VarCardStudioPage.vue`
- Create: `aimdlab/src/components/var-cards/studio/VarCardStudioLayout.vue`
- Create: `aimdlab/src/components/var-cards/studio/VarCardFormPanel.vue`
- Create: `aimdlab/src/components/var-cards/studio/VarCardLivePreviewPanel.vue`
- Create: `aimdlab/src/components/var-cards/studio/VarCardBehaviorPanel.vue`
- Modify: `aimdlab/src/router/index.ts`

**Implementation notes:**
- Studio is manifest editing, not code editing.
- First version should support:
  - card metadata
  - layout kind
  - labels/placeholders
  - enum options
  - required/validation hints
  - demo value
- Built-in cards open in read-only mode with clone CTA.

**Verification:**
- Manual flow:
  1. open built-in card
  2. clone
  3. edit clone
  4. save
  5. gallery reflects updated preview

### Task 7: AimdRecorder Bridge

**Files:**
- Create: `aimdlab/src/features/var-cards/runtime/createRecorderTypePlugins.ts`
- Modify: `aimdlab/src/pages/ProtocolView.vue`
- Optionally create: `aimdlab/src/composables/useVarCardRecorder.ts`

**Implementation notes:**
- Convert loaded card manifests into recorder `typePlugins`.
- Pass generated plugins into `AimdRecorder`.
- Preserve existing built-in behavior by ensuring built-ins are represented as manifests and loaded into the same bridge.
- Keep `fieldAdapters` / `wrapField` reserved for app-owned shell controls.

**Verification:**
- Manual:
  - load protocol with built-in var type
  - confirm no regression
  - load protocol with card-backed type
  - confirm Record renders the card body and persists values

### Task 8: AimdEditor Bridge

**Files:**
- Create: `aimdlab/src/features/var-cards/runtime/createEditorVarTypePresets.ts`
- Modify: `aimdlab/src/pages/EditorPage.vue`
- Optionally modify: `packages/aimd-editor` usage contract only through props

**Implementation notes:**
- Surface cards in editor insertion dialog as user-friendly presets.
- Built-in and user cards both appear in picker.
- Insertion must write stable `recordType` token into AIMD syntax.

**Verification:**
- Insert a cloned user card from the editor.
- Save file.
- Open protocol view and confirm runtime resolution works.

### Task 9: Demo Cards and Guidance

**Files:**
- Create: `aimdlab/src/features/var-cards/demoCards.ts`
- Create: `aimdlab/src/components/var-cards/VarCardHelpCallout.vue`
- Modify: `aimdlab/src/pages/VarCardMarketPage.vue`
- Modify: `aimdlab/src/pages/VarCardStudioPage.vue`

**Implementation notes:**
- Add at least one teaching/demo card that explains how card cloning and customization work.
- Demo cards must use the same preview renderer as regular cards.

**Verification:**
- Manual check that first-time users can understand clone-only workflow from the market/studio surfaces.

## File Ownership and Parallelization Boundaries

### Backend / registry

- Owns: `aimdlab/src-tauri/src/commands/var_cards.rs`, `main.rs`, `commands/mod.rs`
- Must not edit: gallery/studio Vue pages

### Runtime / recorder bridge

- Owns: `aimdlab/src/features/var-cards/runtime/**`, `aimdlab/src/components/var-cards/VarCardShell.vue`, `aimdlab/src/pages/ProtocolView.vue`
- Must not edit: Tauri commands, market route shell

### Market UI

- Owns: `aimdlab/src/pages/VarCardMarketPage.vue`, `aimdlab/src/components/var-cards/VarCardGallery*.vue`, router/app locale nav wiring
- Must not edit: recorder runtime files

### Studio / editor bridge

- Owns: `aimdlab/src/pages/VarCardStudioPage.vue`, `aimdlab/src/components/var-cards/studio/**`, `aimdlab/src/pages/EditorPage.vue`
- Must not edit: Tauri command modules

## Risks and Mitigations

### Risk: Card manifests diverge from recorder capability

- Mitigation: runtime compiler is the only translation layer; do not let pages interpret manifest ad hoc.

### Risk: Built-in cards and legacy types drift apart

- Mitigation: represent built-ins as manifests backed by tests/snapshots comparing current behavior.

### Risk: Preview and Record render differently

- Mitigation: use one `renderField()` path and one `VarCardShell`.

### Risk: Over-designing card behavior DSL

- Mitigation: keep v1 declarative and constrained; add capabilities only after real user needs emerge.

## Suggested Verification Pass

1. `cd aimdlab && pnpm run type-check`
2. `cd aimdlab/src-tauri && cargo check`
3. `cd ~/Projects/player-dev/aimdlab && pnpm tauri:dev`
4. Manual smoke:
   - Market renders cards
   - Built-in preview opens
   - Built-in clone works
   - Studio save updates gallery
   - Editor inserts cloned card type
   - Protocol view renders cloned card in Record

## Recommended Execution Order

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5 and Task 6 in parallel
6. Task 7
7. Task 8
8. Task 9

Plan complete and saved to `aimdlab/docs/plans/2026-03-20-var-card-platform-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
