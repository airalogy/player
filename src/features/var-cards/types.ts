export type VarCardNamespace = "builtin" | "user"

export type VarCardKey = `${VarCardNamespace}:${string}`

export interface VarCardOption {
  label: string
  value: unknown
}

export interface VarCardSchema {
  kind:
    | "text"
    | "textarea"
    | "number"
    | "boolean"
    | "markdown"
    | "code"
    | "dna"
    | "datetime"
  label: string | null
  placeholder: string | null
  defaultValue: unknown
  helperText: string | null
  unit: string | null
  format: string | null
  rows: number | null
  min: number | null
  max: number | null
  step: number | null
  language: string | null
  options: VarCardOption[]
}

export interface VarCardLayout {
  variant: "inline" | "stacked" | "panel"
  density: "compact" | "comfortable"
  align: "start" | "center" | "stretch"
}

export interface VarCardAppearance {
  accentColor: string | null
  icon: string | null
  badge: string | null
}

export interface VarCardBehavior {
  allowManualInput: boolean
  allowCopy: boolean
  liveValue: boolean
}

export interface VarCardManifest {
  id: string
  namespace: VarCardNamespace
  version: string
  title: string
  description: string
  icon: string | null
  tags: string[]
  readonly: boolean
  baseCardId: string | null
  recordType: string
  demoValue: unknown
  schema: VarCardSchema
  layout: VarCardLayout
  appearance: VarCardAppearance
  behavior: VarCardBehavior
}

export interface CloneVarCardPayload {
  sourceManifest: VarCardManifest
  newId: string
}

export function isVarCardType(type: string): boolean {
  return type.startsWith("card:")
}

export function toVarCardRecordType(namespace: VarCardNamespace, slug: string): string {
  return `card:${namespace}/${slug}`
}

export function toVarCardKey(namespace: VarCardNamespace, id: string): VarCardKey {
  return `${namespace}:${id}`
}

export function parseVarCardKey(key: string): { namespace: VarCardNamespace; id: string } | null {
  const [namespace, ...rest] = key.split(":")
  if ((namespace !== "builtin" && namespace !== "user") || rest.length === 0) {
    return null
  }

  return {
    namespace,
    id: rest.join(":"),
  }
}

export function cloneVarCardManifest(manifest: VarCardManifest, id: string): VarCardManifest {
  return {
    ...manifest,
    id,
    namespace: "user",
    readonly: false,
    baseCardId: toVarCardKey(manifest.namespace, manifest.id),
    recordType: toVarCardRecordType("user", id),
  }
}
