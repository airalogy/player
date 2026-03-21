<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue"
import type { ProtocolAnchor } from "@/composables/useProtocolNavigator"

const props = defineProps<{
  anchors: ProtocolAnchor[]
  activeAnchorId: string | null
  hoveredAnchorId: string | null
}>()

const emit = defineEmits<{
  (e: "anchor-click", anchorId: string): void
  (e: "anchor-hover", anchorId: string): void
  (e: "anchor-leave"): void
}>()

const isExpanded = ref(false)
let collapseTimer: ReturnType<typeof setTimeout> | null = null

function handleMouseEnter() {
  if (collapseTimer) {
    clearTimeout(collapseTimer)
    collapseTimer = null
  }
  isExpanded.value = true
}

function handleMouseLeave() {
  collapseTimer = setTimeout(() => {
    isExpanded.value = false
  }, 150)
}

function handleItemClick(anchorId: string) {
  emit("anchor-click", anchorId)
  isExpanded.value = false
}

function handleKeydown(event: KeyboardEvent, anchorId: string) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault()
    handleItemClick(anchorId)
  }
}

function indentStyle(anchor: ProtocolAnchor): Record<string, string> {
  return { paddingLeft: `${(anchor.level - 1) * 12}px` }
}

function kindLabel(anchor: ProtocolAnchor): string {
  switch (anchor.kind) {
    case "section": return anchor.level <= 1 ? "Section" : "Subsection"
    case "step": return "Step"
    case "check": return "Check"
    case "table": return "Table"
    case "quiz": return "Quiz"
    case "callout": return "Callout"
    default: return "Anchor"
  }
}

onBeforeUnmount(() => {
  if (collapseTimer) clearTimeout(collapseTimer)
})
</script>

<template>
  <nav
    class="pnav"
    :class="{ 'pnav--expanded': isExpanded }"
    aria-label="Protocol Navigator"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Collapsed: dot indicators -->
    <div v-show="!isExpanded" class="pnav__dots">
      <button
        v-for="anchor in anchors"
        :key="'dot-' + anchor.id"
        class="pnav__dot"
        :class="[
          `pnav__dot--${anchor.kind}`,
          `pnav__dot--status-${anchor.status}`,
          { 'pnav__dot--active': anchor.id === activeAnchorId },
        ]"
        type="button"
        :aria-label="`${kindLabel(anchor)}: ${anchor.title}`"
        @click="handleItemClick(anchor.id)"
        @focus="handleMouseEnter"
      />
    </div>

    <!-- Expanded: full text outline -->
    <div v-show="isExpanded" class="pnav__outline" role="list">
      <button
        v-for="anchor in anchors"
        :key="'item-' + anchor.id"
        class="pnav__item"
        :class="[
          `pnav__item--${anchor.kind}`,
          `pnav__item--status-${anchor.status}`,
          { 'pnav__item--active': anchor.id === activeAnchorId },
        ]"
        :style="indentStyle(anchor)"
        type="button"
        role="listitem"
        tabindex="0"
        @click="handleItemClick(anchor.id)"
        @mouseenter="emit('anchor-hover', anchor.id)"
        @mouseleave="emit('anchor-leave')"
        @focus="emit('anchor-hover', anchor.id)"
        @blur="emit('anchor-leave')"
        @keydown="handleKeydown($event, anchor.id)"
      >
        <span
          v-if="anchor.status !== 'default'"
          class="pnav__status-dot"
          :class="`pnav__status-dot--${anchor.status}`"
        />
        <span class="pnav__item-title">{{ anchor.title }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.pnav {
  width: 20px;
  overflow: visible;
  user-select: none;
  transition: width 200ms ease;
}

.pnav--expanded {
  width: 220px;
}

/* ── Collapsed dots ── */

.pnav__dots {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-top: 4px;
}

.pnav__dot {
  width: 4px;
  height: 4px;
  border: 0;
  border-radius: 50%;
  background: var(--aimd-text-secondary);
  opacity: 0.35;
  cursor: pointer;
  padding: 0;
  transition: opacity 120ms ease, transform 120ms ease;
}

.pnav__dot:hover,
.pnav__dot:focus-visible {
  opacity: 0.8;
  transform: scale(1.4);
  outline: none;
}

.pnav__dot--section {
  width: 5px;
  height: 5px;
}

.pnav__dot--active {
  background: var(--aimd-color-primary);
  opacity: 1;
  width: 6px;
  height: 6px;
}

.pnav__dot--status-completed { background: #2f7d32; opacity: 0.7; }
.pnav__dot--status-warning   { background: #b26a00; opacity: 0.7; }
.pnav__dot--status-error     { background: #b42318; opacity: 0.7; }

/* Active overrides status */
.pnav__dot--active.pnav__dot--status-completed,
.pnav__dot--active.pnav__dot--status-warning,
.pnav__dot--active.pnav__dot--status-error {
  opacity: 1;
}

/* ── Expanded outline ── */

.pnav__outline {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pnav__item {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  text-align: left;
  font-size: 12px;
  line-height: 1.4;
  color: var(--aimd-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background-color 120ms ease, color 120ms ease;
}

.pnav__item:hover,
.pnav__item:focus-visible {
  background: rgba(26, 115, 232, 0.06);
  color: var(--aimd-text-primary);
  outline: none;
}

.pnav__item--active {
  color: var(--aimd-color-primary);
  font-weight: 600;
}

.pnav__item--section {
  font-weight: 500;
  font-size: 12.5px;
  color: var(--aimd-text-primary);
}

.pnav__item--active.pnav__item--section {
  font-weight: 600;
  color: var(--aimd-color-primary);
}

.pnav__item-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Status dots ── */

.pnav__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pnav__status-dot--completed { background: #2f7d32; }
.pnav__status-dot--warning   { background: #b26a00; }
.pnav__status-dot--error     { background: #b42318; }
</style>
