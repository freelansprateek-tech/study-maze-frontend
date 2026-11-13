import type { ChipTag, DocKind } from '../api-types'

export function chipLabel(chip: ChipTag): string {
  if (chip === 'common') return 'Common'
  if (chip === 'noise') return 'Noise'
  return chip.toUpperCase()
}

export function formatMs(ms: number | undefined): string {
  if (ms === undefined || Number.isNaN(ms)) return '–'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)} s`
}

export function formatScore(value: number): string {
  if (value === 0) return '0'
  return value < 0.001 ? value.toExponential(2) : value.toFixed(4)
}

export function percent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`
}

export const SOURCE_TYPE_LABEL: Record<string, string> = {
  datasheet: 'Datasheet',
  trm: 'Technical Reference Manual',
  'esp-idf-docs': 'ESP-IDF docs',
  github_issue: 'GitHub issue',
  forum: 'Forum thread',
  noise: 'Distractor',
}

export const KIND_LABEL: Record<DocKind, string> = {
  direct: 'Direct-Assist',
  indirect: 'Indirect-Assist',
  noise: 'Noise',
}

/** Tailwind classes per document role. Always paired with a text label. */
export const KIND_TONE: Record<DocKind, { chip: string; bar: string; rule: string }> = {
  direct: {
    chip: 'border-accent/40 bg-accent-soft text-accent',
    bar: 'bg-accent',
    rule: 'border-l-accent',
  },
  indirect: {
    chip: 'border-amber/40 bg-amber-soft text-amber',
    bar: 'bg-amber',
    rule: 'border-l-amber',
  },
  noise: {
    chip: 'border-plum/40 bg-plum-soft text-plum',
    bar: 'bg-plum',
    rule: 'border-l-plum',
  },
}
