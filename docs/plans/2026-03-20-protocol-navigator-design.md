# Protocol Navigator Design

## Overview

`Protocol Navigator` is a structured long-document navigation component for protocol editing and playback views.

Its job is not to replace the browser scrollbar. Its job is to:

1. Tell the user where they are inside a long protocol.
2. Let the user jump to meaningful structure points with very low cognitive cost.

For this product, `Protocol Navigator` is a better name than `Minimap`.
`Minimap` is editor-centric jargon. `Protocol Navigator` is clearer for protocol, experiment, and workflow users.

Suggested internal component names:

- `ProtocolNavigator`
- `ProtocolNavigatorRail`
- `ProtocolNavigatorTick`
- `ProtocolNavigatorPreview`

## Product Positioning

This component should feel like a compressed structural outline, not like a decorative scrollbar.

The rail should stay visually quiet:

- narrow
- sticky
- abstract by default
- informative on hover
- precise on click

The interaction model should prioritize clarity over novelty.

A good first version is:

1. Sticky vertical rail on the right side.
2. Section and step ticks.
3. Active-position highlighting via scrollspy.
4. Hover preview card.
5. Click-to-jump navigation.

Dragging can be added later. It is useful, but not required for the first shippable version.

## Information Model

The navigator should only be built from high-value anchors.

Recommended anchor sources:

- `h2`
- `h3`
- grouped `step` cards
- `check`
- `var_table`
- important `callout`

Do not include ordinary `var` fields in the navigator. They are too granular and will create noise.

Suggested normalized anchor shape:

```ts
type ProtocolAnchor = {
  id: string
  kind: 'section' | 'step' | 'check' | 'table' | 'quiz' | 'callout'
  level: number
  title: string
  summary?: string
  status?: 'default' | 'completed' | 'warning' | 'error'
  element: HTMLElement
}
```

## Visual Design

### Rail

The rail should be thin and understated.

- Long ticks: major sections
- Medium ticks: steps
- Short ticks: secondary anchors such as checks, tables, or callouts
- Active marker: clearly visible but small

Avoid large colored blocks. Status should be encoded with restrained accents:

- completed: muted completion color
- warning: small warm accent
- error: small red dot or marker

### Preview Card

The hover preview card should only show high-value information:

- title
- kind
- optional one-line summary
- optional status

It should not dump large chunks of body text. The preview is for confirmation, not reading.

### Hierarchy

This app should use a two-level emphasis model:

- Level 1: sections / major stages
- Level 2: steps

Everything else should be lower emphasis.

If every anchor is equally strong, the rail becomes unreadable in long protocols.

## Interaction Design

### Desktop

Primary interactions:

- hover a tick: show preview
- click a tick: jump to anchor
- scroll document: rail updates active state

Optional later interaction:

- drag along the rail to scrub through anchors
- show live preview while dragging
- commit jump on pointer release

### Mobile

Do not reuse the scrubber interaction directly on mobile.

Recommended mobile behavior:

- tap a navigator affordance
- open a bottom sheet or side drawer
- show textual section/step list
- tap to jump

Use the same anchor data model, but a different interaction shell.

## Protocol-Specific Semantics

This app has richer protocol semantics than a plain article, so the navigator should reflect them.

Recommended mappings:

- `section`: document stages
- `step`: primary navigation target
- `check`: lightweight marker
- `table`: important structured data block
- `callout`: only when semantically important

Suggested status mapping:

- completed step: completed marker
- step with validation issues: error marker
- table with field errors: error marker
- pending important step: subtle emphasis

## Technical Design

### Source of Truth

The navigator should be generated from the rendered protocol structure, not from ad hoc DOM scraping at random points in the app.

Best source:

- the normalized rendered anchor list produced after protocol rendering and grouping

This is important because grouped step cards, callouts, and tables already carry semantic structure.

### Scroll Tracking

Use `IntersectionObserver` for active-section tracking.

Recommended behavior:

- observe anchor elements
- derive current active anchor from visibility and viewport position
- update rail highlight without heavy scroll listeners

### Position Mapping

Tick positions should map to the document’s relative vertical span.

Two acceptable approaches:

1. DOM-based relative layout after render
2. Anchor index layout with light weighting

For this product, DOM-based relative positioning is more accurate and likely worth it.

### Preview Positioning

Hover preview positioning should use:

- `getBoundingClientRect`
- viewport clamping
- `requestAnimationFrame` only if drag is later added

### Performance

Guardrails:

- do not re-derive anchor structure on every scroll
- cache anchor metadata
- update active state incrementally
- recompute layout on resize, content reflow, or protocol rebuild

## Naming Recommendation

Public-facing name:

- `Protocol Navigator`

Secondary copy options:

- `Jump Through Protocol`
- `Outline Navigator`

Internal engineering names:

- `ProtocolNavigator`
- `ProtocolNavigatorRail`
- `ProtocolNavigatorPreview`

Avoid:

- `Minimap`
- `Scrollspy`

Those terms are accurate internally, but weaker product labels.

## Risks

1. Over-dense rail
   Too many anchors will make the rail unreadable.

2. Over-rich preview
   If the preview card shows too much content, it becomes a tooltip-shaped modal.

3. Weak mobile adaptation
   Drag/scrub behavior does not translate well to touch.

4. Divergent anchor semantics
   If the app exposes raw fields instead of structural anchors, the navigator becomes noisy.

## Recommended MVP

Ship this first:

1. Sticky right-side rail
2. Section + step ticks
3. Scrollspy active marker
4. Hover preview
5. Click jump

Defer for later:

1. Drag scrubber
2. Rich state overlays
3. User pinning/bookmarking
4. Search integration

## Implementation Plan

### Phase 1: Anchor Model

1. Define a normalized `ProtocolAnchor` type.
2. Derive anchors from rendered protocol structure.
3. Restrict default anchors to section/step/check/table/important-callout nodes.

### Phase 2: Rail UI

1. Build `ProtocolNavigatorRail`.
2. Render ticks by anchor kind and level.
3. Add active marker and basic status markers.

### Phase 3: Scroll Sync

1. Add `IntersectionObserver` tracking.
2. Sync current viewport position to active rail marker.
3. Recompute anchor positions after content rebuild or resize.

### Phase 4: Hover Preview

1. Build `ProtocolNavigatorPreview`.
2. Show title, kind, and optional summary/status.
3. Clamp preview within viewport bounds.

### Phase 5: Jump Navigation

1. Add click-to-jump behavior.
2. Smooth-scroll to selected anchor.
3. Ensure focus restoration and accessible target selection where appropriate.

### Phase 6: Mobile Variant

1. Reuse anchor model.
2. Replace rail with drawer or bottom-sheet outline.
3. Keep click-to-jump behavior consistent.

### Phase 7: Optional Enhancements

1. Drag-to-scrub interaction
2. Live preview while dragging
3. Error/completion overlays
4. Search/filter integration

## Decision Summary

The right design for this app is a restrained, structure-first `Protocol Navigator`, not a code-editor minimap.

The first version should optimize for:

- clear document position
- fast jump navigation
- low visual noise
- protocol-aware hierarchy

That is enough to make long protocols materially easier to use without overbuilding the first release.
