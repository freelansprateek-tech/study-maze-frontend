import { useId, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import type {
  ChunkTrace,
  DirectSummary,
  DocKind,
  EntityType,
  PromptSegment,
  QueryResponse,
  SegmentPosition,
} from '../api-types'
import { formatMs, formatScore, KIND_TONE, percent } from '../lib/format'
import { Disclosure, KindTag, Notice, SourceId, Tag } from './ui'

/**
 * THE CP-RAG X-RAY INSPECTOR
 *
 * Three tabs, one per stage of the pipeline that a plain RAG system does not
 * have:
 *   1. Attention   question->chunk attention scores and the K-Means split
 *   2. Summaries   entities, relations and the query-focused summary of each
 *                  direct-assist chunk
 *   3. Prompt      the Head -> Middle -> Tail layout actually sent to the LLM
 */

type TabId = 'attention' | 'summaries' | 'prompt'

const TABS: { id: TabId; label: string; sub: string }[] = [
  { id: 'attention', label: 'Attention & clusters', sub: 'Direct vs. Indirect' },
  { id: 'summaries', label: 'Entities & summaries', sub: 'Direct-Assist branch' },
  { id: 'prompt', label: 'Prompt structure', sub: 'Head → Middle → Tail' },
]

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-rule bg-paper px-3 py-2">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-0.5 font-mono text-[13px] tabular-nums text-ink [overflow-wrap:anywhere]">{value}</dd>
    </div>
  )
}

/* ============================================================
   TAB 1 - ATTENTION SCORES AND K-MEANS CLUSTERS
   ============================================================ */

function AttentionTab({ result }: { result: QueryResponse }) {
  const { attention_scores: scores, classifier } = result

  if (classifier.method !== 'attention-kmeans' || scores.length === 0) {
    return (
      <Notice tone="warn" title="Attention classification was switched off for this query">
        The context was split by retrieval rank instead: the top half is treated as Direct-Assist. No attention scores were
        computed.
      </Notice>
    )
  }

  const max = Math.max(...scores.map((s) => s.raw_score), Number.EPSILON)
  const direct = scores.filter((s) => s.cluster === 'direct')
  const indirect = scores.filter((s) => s.cluster === 'indirect')
  const boundary =
    classifier.direct_centroid !== null && classifier.indirect_centroid !== null
      ? (classifier.direct_centroid + classifier.indirect_centroid) / 2
      : null
  const noiseAsDirect = direct.filter((s) => s.is_noise).length

  return (
    <div>
      <p className="mb-3 text-[13px] text-ink2">
        <span className="font-medium text-ink">{classifier.model}</span> read all {scores.length} documents and then the
        question in one forward pass. Each bar is the average attention a question token paid to a token of that document,
        over the last {classifier.layers_used.length} layers. K-Means (K = 2) splits the scores; the cluster with the higher
        centroid is Direct-Assist.
      </p>

      <dl className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat label="Direct-Assist" value={`${direct.length} docs`} />
        <Stat label="Indirect-Assist" value={`${indirect.length} docs`} />
        <Stat
          label="Centroids (direct / indirect)"
          value={`${classifier.direct_centroid !== null ? formatScore(classifier.direct_centroid) : '–'} / ${
            classifier.indirect_centroid !== null ? formatScore(classifier.indirect_centroid) : '–'
          }`}
        />
        <Stat
          label="Tokens · layers · device"
          value={`${classifier.total_tokens} · ${classifier.layers_used.join(',')} · ${classifier.device}`}
        />
      </dl>

      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-accent" aria-hidden="true" /> Direct-Assist
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-amber" aria-hidden="true" /> Indirect-Assist
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="hatch h-2.5 w-4 rounded-sm bg-ink3" aria-hidden="true" /> hatched = distractor document
        </span>
        {boundary !== null ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-0 border-l-2 border-dashed border-ink2" aria-hidden="true" /> cluster boundary
          </span>
        ) : null}
      </div>

      <ol className="flex flex-col gap-1.5">
        {scores.map((score, index) => {
          const tone = KIND_TONE[score.cluster]
          return (
            <li key={score.source_id} className="rounded-lg border border-rule bg-paper px-3 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="w-5 font-mono text-[11.5px] tabular-nums text-ink3">{index + 1}.</span>
                <SourceId id={score.source_id} />
                <KindTag kind={score.cluster} />
                {score.is_noise ? <KindTag kind="noise" /> : null}
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink" title={score.title}>
                  {score.title}
                </span>
                <span className="font-mono text-[12.5px] font-semibold tabular-nums text-ink">
                  {formatScore(score.raw_score)}
                </span>
                <span className="w-12 text-right font-mono text-[11.5px] tabular-nums text-ink3">
                  {percent(score.normalized_score)}
                </span>
              </div>
              <div
                className="relative mt-1.5 h-2.5 rounded-full bg-sunk"
                role="img"
                aria-label={`${score.source_id}: attention ${formatScore(score.raw_score)}, ${score.cluster} assist`}
              >
                <div
                  className={`h-full rounded-full ${tone.bar} ${score.is_noise ? 'hatch' : ''}`}
                  style={{ width: `${Math.max((score.raw_score / max) * 100, 1.5)}%` }}
                />
                {boundary !== null ? (
                  <span
                    className="absolute -bottom-1 -top-1 border-l-2 border-dashed border-ink2"
                    style={{ left: `${Math.min((boundary / max) * 100, 100)}%` }}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <p className="mt-1 font-mono text-[11px] tabular-nums text-ink3">
                tokens [{score.token_span[0]}, {score.token_span[1]}) · {score.n_tokens} tok · per layer{' '}
                {score.per_layer.map((v) => formatScore(v)).join(' / ')}
              </p>
            </li>
          )
        })}
      </ol>

      {noiseAsDirect > 0 ? (
        <div className="mt-3">
          <Notice tone="warn">
            {noiseAsDirect} distractor document{noiseAsDirect > 1 ? 's were' : ' was'} clustered as Direct-Assist. The
            summarisation step checks each direct document against the question and demotes irrelevant ones.
          </Notice>
        </div>
      ) : null}
      {classifier.question_span ? (
        <p className="mt-3 font-mono text-[11.5px] tabular-nums text-ink3">
          question tokens [{classifier.question_span[0]}, {classifier.question_span[1]}) of {classifier.total_tokens}
        </p>
      ) : null}
    </div>
  )
}

/* ============================================================
   TAB 2 - ENTITIES, RELATIONS, QUERY-FOCUSED SUMMARIES
   ============================================================ */

const ENTITY_TONE: Record<EntityType, string> = {
  pin: 'border-accent/40 bg-accent-soft text-accent',
  register: 'border-plum/40 bg-plum-soft text-plum',
  electrical: 'border-amber/40 bg-amber-soft text-amber',
  api: 'border-moss/35 bg-moss-soft text-moss',
  config: 'border-moss/35 bg-moss-soft text-moss',
  peripheral: 'border-rule-strong bg-sunk text-ink2',
  other: 'border-rule-strong bg-sunk text-ink2',
}

const METHOD_LABEL: Record<DirectSummary['method'], string> = {
  llm: 'LLM summary',
  extractive: 'Extractive summary',
  raw: 'Raw chunk (summarisation off)',
}

function SummaryCard({ summary, chunk }: { summary: DirectSummary; chunk: ChunkTrace | undefined }) {
  const groups = new Map<EntityType, string[]>()
  for (const entity of summary.entities) {
    groups.set(entity.type, [...(groups.get(entity.type) ?? []), entity.text])
  }
  return (
    <li className={`rounded-xl border bg-paper p-3.5 ${summary.relevant ? 'border-rule' : 'border-dashed border-rule-strong'}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <SourceId id={summary.source_id} />
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink" title={summary.title}>
          {summary.title}
        </span>
        <Tag tone={summary.method === 'llm' ? 'accent' : 'muted'}>{METHOD_LABEL[summary.method]}</Tag>
        {!summary.relevant ? <Tag tone="warn">Demoted to Indirect</Tag> : null}
        {chunk?.is_noise ? <KindTag kind="noise" /> : null}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-1.5">Level 1 · Hardware entities</p>
          {summary.entities.length === 0 ? (
            <p className="text-[12.5px] text-ink3">No hardware entities detected.</p>
          ) : (
            <dl className="flex flex-col gap-1.5">
              {[...groups.entries()].map(([type, values]) => (
                <div key={type} className="flex items-start gap-2">
                  <dt className="w-[72px] shrink-0 pt-0.5 font-mono text-[11px] uppercase tracking-wide text-ink3">{type}</dt>
                  <dd className="flex flex-wrap gap-1">
                    {values.map((value) => (
                      <span key={value} className={`rounded-md border px-1.5 py-0.5 font-mono text-[11.5px] leading-none ${ENTITY_TONE[type]}`}>
                        {value}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div>
          <p className="eyebrow mb-1.5">Level 2 · Relations</p>
          {summary.relations.length === 0 ? (
            <p className="text-[12.5px] text-ink3">No relations extracted.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {summary.relations.map((relation, index) => (
                <li key={index} className="flex flex-wrap items-center gap-1 text-[12.5px]">
                  <span className="rounded-md border border-rule-strong bg-surface px-1.5 py-0.5 font-mono text-[11.5px] text-ink">
                    {relation.subject}
                  </span>
                  <span className="text-ink3">— {relation.predicate} →</span>
                  <span className="rounded-md border border-rule-strong bg-surface px-1.5 py-0.5 font-mono text-[11.5px] text-ink">
                    {relation.object}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="eyebrow mb-1.5">Level 3 · Query-focused summary</p>
        <p className="whitespace-pre-wrap rounded-lg border border-accent/25 bg-accent-soft/40 px-3 py-2 text-[13.5px] leading-relaxed text-ink">
          {summary.summary}
        </p>
        {summary.evidence ? (
          <p className="mt-1.5 border-l-2 border-rule-strong pl-3 text-[12.5px] leading-relaxed text-ink2">
            <span className="eyebrow mr-1.5">Key sentences in the source</span>
            “{summary.evidence}”
          </p>
        ) : null}
      </div>
      {chunk && summary.method !== 'raw' ? (
        <div className="mt-2">
          <Disclosure summary={`Original chunk (${chunk.text.split(/\s+/).length} words → ${summary.summary.split(/\s+/).length})`}>
            <p className="whitespace-pre-wrap rounded-lg border border-rule bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink2">
              {chunk.text}
            </p>
          </Disclosure>
        </div>
      ) : null}
    </li>
  )
}

function SummariesTab({ result }: { result: QueryResponse }) {
  const chunks = new Map<string, ChunkTrace>()
  for (const chunk of [...result.direct_chunks, ...result.indirect_chunks, ...result.noise_chunks]) {
    chunks.set(chunk.source_id, chunk)
  }
  if (result.summaries.length === 0) {
    return <Notice tone="info">No document was classified as Direct-Assist for this query.</Notice>
  }
  return (
    <div>
      <p className="mb-3 text-[13px] text-ink2">
        Multilevel Semantic Optimization of the {result.summaries.length} Direct-Assist document
        {result.summaries.length > 1 ? 's' : ''}: hardware entities, then the relations between them, then a short summary
        aimed at the question. Each summary is sent to the LLM together with the full original chunk. A summary that adds a
        number, drops a negation, or uses words its source never does is rejected and replaced by sentences copied from
        the chunk.
      </p>
      <ul className="flex flex-col gap-3">
        {result.summaries.map((summary) => (
          <SummaryCard key={summary.source_id} summary={summary} chunk={chunks.get(summary.source_id)} />
        ))}
      </ul>
    </div>
  )
}

/* ============================================================
   TAB 3 - PROMPT STRUCTURE
   ============================================================ */

const SEGMENT_STYLE: Record<SegmentPosition, { rule: string; name: string; note: string }> = {
  system: { rule: 'border-l-ink3', name: 'System', note: 'Grounding rules' },
  head: { rule: 'border-l-accent', name: 'Head', note: 'Direct — start of context, high attention' },
  middle: { rule: 'border-l-amber', name: 'Middle', note: 'Indirect + shuffled noise — low-attention zone' },
  tail: { rule: 'border-l-accent', name: 'Tail', note: 'Direct — end of context, high attention' },
  flat: { rule: 'border-l-ink3', name: 'Flat', note: 'Retrieval order, no head/tail placement' },
  question: { rule: 'border-l-moss', name: 'Question', note: 'User question + "Let us think step by step."' },
}

function PositionStrip({ segments }: { segments: PromptSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.approx_tokens, 0) || 1
  const fill: Record<SegmentPosition, string> = {
    system: 'bg-ink3',
    head: 'bg-accent',
    middle: 'bg-amber',
    tail: 'bg-accent',
    flat: 'bg-ink3',
    question: 'bg-moss',
  }
  return (
    <div className="mb-4">
      <div className="flex h-7 w-full gap-0.5 overflow-hidden rounded-md" role="img" aria-label="Share of the prompt taken by each segment">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`${fill[segment.position]} grid min-w-[30px] place-items-center px-1`}
            style={{ flexGrow: Math.max(segment.approx_tokens / total, 0.05), flexBasis: 0 }}
            title={`${SEGMENT_STYLE[segment.position].name}: ~${segment.approx_tokens} tokens`}
          >
            <span className="truncate text-[11px] font-semibold text-surface">{SEGMENT_STYLE[segment.position].name}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-ink3">
        <span>prompt start</span>
        <span>~{total} tokens</span>
        <span>prompt end</span>
      </div>
    </div>
  )
}

function ItemRow({ kind, sourceId, title, text }: { kind: DocKind; sourceId: string; title: string; text: string }) {
  return (
    <li className={`rounded-md border border-l-[3px] border-rule bg-surface px-2.5 py-1.5 ${KIND_TONE[kind].rule}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <SourceId id={sourceId} />
        <KindTag kind={kind} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink" title={title}>
          {title}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink2" title={text}>
        {text}
      </p>
    </li>
  )
}

function PromptTab({ result }: { result: QueryResponse }) {
  const segments = result.prompt_layout
  return (
    <div>
      <p className="mb-3 text-[13px] text-ink2">
        The prompt in the order the LLM reads it. Direct-Assist summaries are split across the head and the tail, where
        models attend most; Indirect-Assist chunks and noise documents are shuffled into the middle.
      </p>
      <PositionStrip segments={segments} />

      <ol className="flex flex-col gap-2">
        {segments.map((segment, index) => {
          const style = SEGMENT_STYLE[segment.position]
          return (
            <li key={index} className={`rounded-lg border border-l-4 border-rule bg-paper px-3 py-2.5 ${style.rule}`}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-mono text-[11.5px] tabular-nums text-ink3">{index + 1}</span>
                <h4 className="text-[13.5px] font-semibold text-ink">{segment.label}</h4>
                <span className="text-[12px] text-ink3">{style.note}</span>
                <span className="ml-auto font-mono text-[11.5px] tabular-nums text-ink3">
                  {segment.items.length > 0 ? `${segment.items.length} docs · ` : ''}~{segment.approx_tokens} tok
                </span>
              </div>
              {segment.items.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {segment.items.map((item) => (
                    <ItemRow key={item.source_id} kind={item.kind} sourceId={item.source_id} title={item.title} text={item.text} />
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-snug text-ink2">{segment.text}</p>
              )}
            </li>
          )
        })}
      </ol>

      <div className="mt-3">
        <Disclosure summary="Raw prompt sent to the LLM">
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-rule bg-sunk px-3 py-2.5 font-mono text-[12px] leading-relaxed text-ink2">
            {result.final_prompt}
          </pre>
        </Disclosure>
      </div>
    </div>
  )
}

/* ============================================================
   INSPECTOR SHELL
   ============================================================ */

const STAGES: { key: string; label: string }[] = [
  { key: 'retrieval', label: 'Retrieve' },
  { key: 'classification', label: 'Classify' },
  { key: 'direct_processing', label: 'Summarise' },
  { key: 'indirect_processing', label: 'Rearrange' },
  { key: 'assembly', label: 'Assemble' },
  { key: 'generation', label: 'Generate' },
]

export function XRayInspector({ result }: { result: QueryResponse }) {
  const [tab, setTab] = useState<TabId>('attention')
  const baseId = useId()

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const index = TABS.findIndex((t) => t.id === tab)
    const next = TABS[(index + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
    setTab(next.id)
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus()
  }

  return (
    <details className="card group" aria-labelledby={`${baseId}-title`}>
      <summary className="flex list-none items-center gap-3 p-4 sm:px-6 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <h2 id={`${baseId}-title`} className="text-[15px] font-semibold text-ink">
            How this answer was built
          </h2>
          <p className="mt-0.5 text-[13px] text-ink2">
            {result.retrieved_chunks.length} chunks retrieved → {result.direct_chunks.length} Direct-Assist,{' '}
            {result.indirect_chunks.length} Indirect-Assist
          </p>
        </div>
        <span className="shrink-0 text-[18px] text-ink3 transition-transform group-open:rotate-90" aria-hidden="true">
          ›
        </span>
      </summary>
      <div className="border-t border-rule p-4 sm:p-6">
      <ol className="mb-4 flex flex-wrap gap-1.5" aria-label="Time spent in each pipeline stage">
        {STAGES.map((stage) => (
          <li key={stage.key} className="rounded-md border border-rule bg-paper px-2 py-1 text-[11.5px] text-ink2">
            {stage.label} <span className="font-mono tabular-nums text-ink">{formatMs(result.timings_ms[stage.key])}</span>
          </li>
        ))}
      </ol>

      <div role="tablist" aria-label="Pipeline stages" onKeyDown={onKeyDown} className="mb-4 flex gap-1 overflow-x-auto border-b border-rule">
        {TABS.map((t) => {
          const selected = t.id === tab
          return (
            <button
              key={t.id}
              id={`${baseId}-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`-mb-px shrink-0 border-b-2 px-3 pb-2 pt-1 text-left transition-colors ${
                selected ? 'border-accent text-ink' : 'border-transparent text-ink2 hover:text-ink'
              }`}
            >
              <span className="block text-[13.5px] font-semibold">{t.label}</span>
              <span className="block text-[11.5px] text-ink3">{t.sub}</span>
            </button>
          )
        })}
      </div>

      <div id={`${baseId}-panel-${tab}`} role="tabpanel" aria-labelledby={`${baseId}-tab-${tab}`} tabIndex={0}>
        {tab === 'attention' ? <AttentionTab result={result} /> : null}
        {tab === 'summaries' ? <SummariesTab result={result} /> : null}
        {tab === 'prompt' ? <PromptTab result={result} /> : null}
      </div>
      </div>
    </details>
  )
}
