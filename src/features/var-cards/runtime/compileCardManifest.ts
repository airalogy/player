import type { AimdTypePlugin, AimdVarInputKind } from "@airalogy/aimd-recorder"
import {
  BUILT_IN_AIMD_TYPE_PLUGINS,
  getVarInputKind,
  normalizeVarTypeName,
  resolveAimdTypePlugin,
} from "@airalogy/aimd-recorder"
import { resolveAimdCodeEditorLanguage } from "@airalogy/aimd-recorder/code-types"

export type VarCardNamespace = "builtin" | "user"

export interface VarCardSelectOption {
  label: string
  value: unknown
}

export interface VarCardManifestSchema {
  baseType?: string
  inputKind?: AimdVarInputKind
  placeholder?: string
  codeLanguage?: string
  enumOptions?: VarCardSelectOption[]
}

export interface VarCardManifestAppearance {
  accentColor?: string
}

export interface VarCardManifest {
  id: string
  namespace: VarCardNamespace
  version: string
  title: string
  description: string
  tags: string[]
  readonly: boolean
  recordType: string
  demoValue: unknown
  schema?: VarCardManifestSchema
  appearance?: VarCardManifestAppearance
}

export interface CompiledVarCardManifest {
  manifest: VarCardManifest
  baseType: string
  normalizedBaseType: string
  inputKind: AimdVarInputKind
  placeholder?: string
  codeLanguage?: string | null
  enumOptions: VarCardSelectOption[]
  accentColor?: string
  basePlugin?: AimdTypePlugin
}

export function compileCardManifest(manifest: VarCardManifest): CompiledVarCardManifest {
  const baseType = manifest.schema?.baseType ?? manifest.recordType
  const basePlugin = resolveAimdTypePlugin(baseType, BUILT_IN_AIMD_TYPE_PLUGINS)
  const inputKind = manifest.schema?.inputKind ?? getVarInputKind(baseType, {
    inputType: manifest.schema?.inputKind,
    codeLanguage: manifest.schema?.codeLanguage,
    typePlugin: basePlugin,
  })

  return {
    manifest,
    baseType,
    normalizedBaseType: normalizeVarTypeName(baseType),
    inputKind,
    placeholder: manifest.schema?.placeholder,
    codeLanguage: resolveAimdCodeEditorLanguage(baseType, {
      inputType: manifest.schema?.inputKind,
      codeLanguage: manifest.schema?.codeLanguage,
    }),
    enumOptions: manifest.schema?.enumOptions ?? [],
    accentColor: manifest.appearance?.accentColor,
    basePlugin,
  }
}
