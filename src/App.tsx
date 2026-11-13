import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, getChips, postQuery } from './api'
import type { ChipId, ChipInfo, QueryResponse } from './api-types'
import { AnswerCard } from './components/AnswerCard'
import { AskPanel } from './components/AskPanel'
import { AppShell } from './components/Shell'
import { Notice } from './components/ui'
import { XRayInspector } from './components/XRay'
import { useHealth } from './lib/useHealth'
import { useTheme } from './lib/useTheme'

/**
 * One page, no router: a single panel to pick a chip and ask a question,
 * and the answer (with its sources and the pipeline inspector) below it.
 *
 * All data comes from the backend over HTTP: the chip catalogue from
 * GET /api/chips, answers from POST /api/query.
 */

function LoadingPanel({ chipLabel, startedAt }: { chipLabel: string; startedAt: number }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500)
    return () => window.clearInterval(id)
  }, [startedAt])
  const stages = [
    `Searching the ${chipLabel} documentation`,
    'Scoring how relevant each chunk is to the question',
    'Summarising the most relevant chunks',
    'Writing the answer from the documentation',
  ]
  return (
    <section className="card p-4 sm:p-6" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3">
        <span className="spinner text-accent" aria-hidden="true" />
        <h2 className="text-[15px] font-semibold text-ink">Finding your answer</h2>
        <span className="ml-auto font-mono text-[12.5px] tabular-nums text-ink3">{elapsed}s</span>
      </div>
      <ol className="mt-3 flex flex-col gap-1.5 text-[13px] text-ink2">
        {stages.map((stage, index) => (
          <li key={stage} className="flex gap-2">
            <span className="font-mono text-[12px] tabular-nums text-ink3">{index + 1}.</span>
            {stage}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[12.5px] text-ink3">This usually takes 20 to 60 seconds; the first question is the slowest.</p>
    </section>
  )
}

export default function App() {
  const { health, info, recheck } = useHealth()
  const { theme, toggle } = useTheme()

  const [chips, setChips] = useState<ChipInfo[]>([])
  const [chipsError, setChipsError] = useState<string | null>(null)

  const [selectedChip, setSelectedChip] = useState<ChipId | ''>('')
  const [question, setQuestion] = useState('')

  const [loading, setLoading] = useState(false)
  const [startedAt, setStartedAt] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<QueryResponse | null>(null)
  const [activeSource, setActiveSource] = useState<{ id: string; nonce: number } | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const loadChips = useCallback(async () => {
    try {
      const body = await getChips()
      setChips(body.chips)
      setChipsError(null)
    } catch (e) {
      setChipsError(e instanceof ApiError ? e.message : 'Could not load the chip list.')
    }
  }, [])

  // Load the catalogue on mount, and again whenever the API comes (back) up.
  useEffect(() => {
    if (health === 'down' || health === 'checking') return
    void loadChips()
  }, [health, loadChips])

  const chip = chips.find((c) => c.id === selectedChip) ?? null

  const onChipChange = (next: ChipId | '') => {
    setSelectedChip(next)
    // A question written for one chip is rarely right for another, and an
    // answer for the previous chip must not sit under the new chip's name.
    setQuestion('')
    setResult(null)
    setError(null)
    setActiveSource(null)
  }

  const submit = async () => {
    if (!selectedChip || loading) return
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setStartedAt(Date.now())
    setError(null)
    setResult(null)
    setActiveSource(null)
    window.requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    try {
      const response = await postQuery(
        { question: question.trim(), selected_chip: selectedChip },
        controller.signal,
      )
      setResult(response)
      window.requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof ApiError ? e.message : 'The request failed unexpectedly.')
      void recheck()
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  const cancel = () => abortRef.current?.abort()

  return (
    <AppShell health={health} info={info} onRecheck={() => void recheck()} theme={theme} onToggleTheme={toggle}>
      {health === 'down' ? (
        <div className="mb-4">
          <Notice tone="bad" title="The backend is not reachable">
            Start it from the backend folder with <code className="font-mono">uvicorn app.main:app --port 8000</code>, and
            check <code className="font-mono">VITE_API_BASE_URL</code> in this app's <code className="font-mono">.env</code>.
          </Notice>
        </div>
      ) : null}
      {health === 'degraded' ? (
        <div className="mb-4">
          <Notice tone="warn" title="The knowledge base is empty">
            Run <code className="font-mono">python scripts/seed_kb.py</code> in the backend folder, then reload.
          </Notice>
        </div>
      ) : null}

      <div className="mb-5 text-center sm:mb-7">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink sm:text-[34px]">
          Find your way through any <span className="text-accent">datasheet</span>
        </h1>
        <p className="mx-auto mt-2 max-w-[520px] text-[14px] text-ink2 sm:text-[15px]">
          Pick your chip or board, ask in plain English, and get a clear answer taken from its official documentation.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:gap-5">
        {chipsError && chips.length === 0 ? (
          <Notice
            tone="bad"
            action={
              <button type="button" onClick={() => void loadChips()} className="text-[12.5px] font-semibold text-accent">
                Retry
              </button>
            }
          >
            {chipsError}
          </Notice>
        ) : null}

        <AskPanel
          chips={chips}
          chip={chip}
          selectedChip={selectedChip}
          onChipChange={onChipChange}
          question={question}
          onQuestionChange={setQuestion}
          loading={loading}
          onSubmit={() => void submit()}
          onCancel={cancel}
        />

        <div ref={resultRef} className="flex min-w-0 scroll-mt-[72px] flex-col gap-4 sm:gap-5">
          {error ? (
            <Notice tone="bad" title="The question could not be answered">
              {error}
            </Notice>
          ) : null}
          {loading && chip ? <LoadingPanel chipLabel={chip.label} startedAt={startedAt} /> : null}
          {!loading && result ? (
            <>
              <section className="card p-4 sm:p-6" aria-label="Answer">
                <AnswerCard
                  result={result}
                  activeSource={activeSource}
                  onCite={(id) => setActiveSource({ id, nonce: Date.now() })}
                />
              </section>
              <XRayInspector result={result} />
            </>
          ) : null}
        </div>
      </div>
    </AppShell>
  )
}
