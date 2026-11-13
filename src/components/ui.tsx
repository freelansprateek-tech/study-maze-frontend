import type { ReactNode } from 'react'
import type { DocKind } from '../api-types'
import { KIND_LABEL, KIND_TONE } from '../lib/format'
import { IconAlert, IconInfo } from './icons'

/* ============================================================
   TAGS
   Small status tokens: hairline border, soft fill, never a loud pill.
   ============================================================ */

export type Tone = 'ok' | 'warn' | 'bad' | 'muted' | 'accent'

const TAG_TONE: Record<Tone, string> = {
  ok: 'border-moss/35 bg-moss-soft text-moss',
  warn: 'border-amber/40 bg-amber-soft text-amber',
  bad: 'border-blood/35 bg-blood-soft text-blood',
  muted: 'border-rule-strong bg-sunk text-ink2',
  accent: 'border-accent/40 bg-accent-soft text-accent',
}

const TAG_BASE =
  'inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11.5px] font-medium leading-none'

export function Tag({ tone = 'muted', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span className={`${TAG_BASE} ${TAG_TONE[tone]}`} title={title}>
      {children}
    </span>
  )
}

export function KindTag({ kind }: { kind: DocKind }) {
  return <span className={`${TAG_BASE} ${KIND_TONE[kind].chip}`}>{KIND_LABEL[kind]}</span>
}

export function SourceId({ id }: { id: string }) {
  return (
    <span className="rounded-sm border border-rule-strong bg-surface px-1 font-mono text-[11.5px] font-semibold tabular-nums text-ink">
      {id}
    </span>
  )
}

/* ============================================================
   NOTICE
   ============================================================ */

const NOTICE_TONE: Record<'info' | 'warn' | 'bad', string> = {
  info: 'border-accent/30 bg-accent-soft text-ink',
  warn: 'border-amber/40 bg-amber-soft text-ink',
  bad: 'border-blood/35 bg-blood-soft text-ink',
}

export function Notice({
  tone = 'info',
  title,
  children,
  action,
}: {
  tone?: 'info' | 'warn' | 'bad'
  title?: string
  children?: ReactNode
  action?: ReactNode
}) {
  const Icon = tone === 'info' ? IconInfo : IconAlert
  const iconColor = tone === 'info' ? 'text-accent' : tone === 'warn' ? 'text-amber' : 'text-blood'
  return (
    <div
      role={tone === 'bad' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] ${NOTICE_TONE[tone]}`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${iconColor}`} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-ink2 [overflow-wrap:anywhere]">{children}</div> : null}
      </div>
      {action}
    </div>
  )
}

/* ============================================================
   EXPANDABLE TEXT
   ============================================================ */

export function Disclosure({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="inline-flex list-none items-center gap-1 text-[12.5px] font-medium text-accent hover:text-accent-mid [&::-webkit-details-marker]:hidden">
        <span className="transition-transform group-open:rotate-90" aria-hidden="true">
          ›
        </span>
        {summary}
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  )
}
