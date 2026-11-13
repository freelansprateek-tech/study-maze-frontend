import { Fragment, useEffect, useRef } from 'react'
import type { Citation, GroundingStatus, QueryResponse } from '../api-types'
import { chipLabel, formatMs, SOURCE_TYPE_LABEL } from '../lib/format'
import { IconExternal } from './icons'
import { Disclosure, Notice, SourceId, Tag } from './ui'
import type { Tone } from './ui'

/**
 * THE GROUNDED ANSWER AND ITS SOURCES
 *
 * Citation tags in the answer ([S2]) are buttons. Activating one scrolls to
 * and highlights the matching source card, whose heading is the citation in
 * the form [Doc Title | Chip | Section].
 */

const STATUS: Record<GroundingStatus, { tone: Tone; label: string; help: string }> = {
  grounded: {
    tone: 'ok',
    label: 'Grounded in sources',
    help: 'The answer cites documents retrieved for this chip.',
  },
  uncited: {
    tone: 'warn',
    label: 'No citation given',
    help: 'The model answered from the supplied documents but did not tag a source. Check the sources below before relying on it.',
  },
  withheld: {
    tone: 'warn',
    label: 'Answer withheld',
    help: 'The model produced a value that appears in none of the retrieved documents, so its answer was not shown.',
  },
  not_covered: {
    tone: 'muted',
    label: 'Not covered by the documentation',
    help: 'The retrieved documents for this chip do not contain the answer, so none was generated.',
  },
}

const CITATION_GROUP = /(\[\s*(?:S\d+\s*(?:,|;|&|and)?\s*)+\])/gi

/** Render text with [S1] / [S1, S3] tags turned into buttons. */
function CitedText({ text, known, onCite }: { text: string; known: Set<string>; onCite: (id: string) => void }) {
  const parts = text.split(CITATION_GROUP)
  return (
    <>
      {parts.map((part, index) => {
        const shown = (group: string | undefined) =>
          (group?.match(/S\d+/gi) ?? []).map((id) => id.toUpperCase()).filter((id) => known.has(id))
        // Text before a hidden tag loses its trailing space, so "LDO [S5]." reads "LDO."
        if (index % 2 === 0) {
          const hiddenNext = index + 1 < parts.length && shown(parts[index + 1]).length === 0
          return <Fragment key={index}>{hiddenNext ? part.trimEnd() : part}</Fragment>
        }
        const ids = shown(part)
        if (ids.length === 0) return null
        return (
          <span key={index} className="mx-0.5 inline-flex gap-0.5 align-baseline">
            {ids.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onCite(id)}
                  title={`Show source ${id}`}
                  className="rounded-sm border border-accent/40 bg-accent-soft px-1 font-mono text-[11.5px] font-semibold tabular-nums text-accent hover:bg-accent hover:text-accent-ink"
                >
                  {id}
                </button>
            ))}
          </span>
        )
      })}
    </>
  )
}

function SourceCard({ citation, active }: { citation: Citation; active: boolean }) {
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (!active || !ref.current) return
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const details = ref.current.querySelector('details')
    if (details) details.open = true
  }, [active])

  return (
    <li
      ref={ref}
      id={`source-${citation.source_id}`}
      className={`rounded-lg border bg-paper px-3 py-2.5 ${active ? 'flash border-accent-bright' : 'border-rule'}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <SourceId id={citation.source_id} />
        <span className="text-[11.5px] text-ink3">{SOURCE_TYPE_LABEL[citation.source_type] ?? citation.source_type}</span>
      </div>
      <p className="mt-1.5 font-mono text-[12.5px] leading-snug text-ink [overflow-wrap:anywhere]">
        [{citation.title} | {chipLabel(citation.chip)} | {citation.section || '–'}]
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <Disclosure summary="Show source text">
          <p className="whitespace-pre-wrap rounded-md border border-rule bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink2">
            {citation.excerpt}
          </p>
        </Disclosure>
        {citation.url ? (
          <a
            href={citation.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:text-accent-mid"
          >
            Open original <IconExternal size={12} />
          </a>
        ) : null}
      </div>
    </li>
  )
}

export function AnswerCard({
  result,
  activeSource,
  onCite,
}: {
  result: QueryResponse
  activeSource: { id: string; nonce: number } | null
  onCite: (id: string) => void
}) {
  const status = STATUS[result.grounding_status]
  // Students see one source only: the first one the answer itself cites, or
  // failing that the first cited anywhere. Tags for other sources are hidden.
  const byId = new Map(result.citations.map((c) => [c.source_id, c]))
  const firstTag = (result.answer.match(/S\d+/gi) ?? []).map((id) => id.toUpperCase()).find((id) => byId.has(id))
  const primary = (firstTag ? byId.get(firstTag) : undefined) ?? result.citations.find((c) => c.cited) ?? null
  const known = new Set(primary ? [primary.source_id] : [])

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tag tone="accent">{chipLabel(result.selected_chip)}</Tag>
        <Tag tone={status.tone} title={status.help}>
          {status.label}
        </Tag>
        <span className="font-mono text-[11.5px] tabular-nums text-ink3 sm:ml-auto">
          {formatMs(result.timings_ms.total)} · {result.models.llm_model}
        </span>
      </div>

      <p className="mb-2 text-[13.5px] text-ink2">{result.question}</p>
      <div
        className={`rounded-xl border px-4 py-3.5 ${
          result.grounding_status === 'not_covered' || result.grounding_status === 'withheld' ? 'border-rule-strong bg-sunk' : 'border-accent/30 bg-accent-soft/40'
        }`}
      >
        <p className="eyebrow mb-1">Answer</p>
        <p className="whitespace-pre-wrap text-[15.5px] leading-relaxed text-ink [overflow-wrap:anywhere]">
          <CitedText text={result.answer} known={known} onCite={onCite} />
        </p>
      </div>

      {result.grounding_status !== 'grounded' ? (
        <div className="mt-3">
          <Notice tone={result.grounding_status === 'not_covered' ? 'info' : 'warn'}>{result.grounding_note || status.help}</Notice>
        </div>
      ) : null}

      {result.explanation ? (
        <details className="group mt-3 rounded-xl border border-rule bg-paper">
          <summary className="flex list-none items-center gap-2 px-4 py-3 text-[14px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-accent transition-transform group-open:rotate-90" aria-hidden="true">
              ›
            </span>
            <span className="flex-1">Explain this in more detail</span>
            <span className="text-[12px] font-normal text-ink3 group-open:hidden">Tap to open</span>
          </summary>
          <p className="whitespace-pre-wrap border-t border-rule px-4 py-3.5 text-[14.5px] leading-[1.75] text-ink2 [overflow-wrap:anywhere]">
            <CitedText text={result.explanation} known={known} onCite={onCite} />
          </p>
        </details>
      ) : null}

      {result.reasoning ? (
        <div className="mt-3">
          <Disclosure summary="How the model worked it out">
            <p className="whitespace-pre-wrap rounded-lg border border-rule bg-paper px-3 py-2.5 text-[13px] leading-relaxed text-ink2">
              <CitedText text={result.reasoning} known={known} onCite={onCite} />
            </p>
          </Disclosure>
        </div>
      ) : null}

      {primary ? (
        <div className="mt-5">
          <h3 className="mb-2 text-[13px] font-semibold text-ink">Where this comes from</h3>
          <ul>
            <SourceCard
              key={`${primary.source_id}-${activeSource?.id === primary.source_id ? activeSource.nonce : 0}`}
              citation={primary}
              active={activeSource?.id === primary.source_id}
            />
          </ul>
        </div>
      ) : null}
    </div>
  )
}
