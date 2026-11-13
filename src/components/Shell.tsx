import type { ReactNode } from 'react'
import { API_BASE } from '../api'
import type { HealthResponse } from '../api-types'
import type { Health } from '../lib/useHealth'
import type { Theme } from '../lib/useTheme'
import { IconMaze, IconMoon, IconSun } from './icons'

const HEALTH_TEXT: Record<Health, string> = {
  checking: 'Checking API…',
  up: 'API online',
  degraded: 'Knowledge base empty',
  down: 'API offline',
}

const HEALTH_DOT: Record<Health, string> = {
  checking: 'bg-ink3',
  up: 'bg-moss',
  degraded: 'bg-amber',
  down: 'bg-blood',
}

function HealthBadge({ health, info, onRecheck }: { health: Health; info: HealthResponse | null; onRecheck: () => void }) {
  const title = info
    ? `${API_BASE}\n${info.kb_chunks} chunks indexed\nGenerator: ${info.llm_provider} / ${info.llm_model}\nClassifier: ${info.classifier_model} on ${info.device}`
    : `${API_BASE}\nClick to check again`
  return (
    <button
      type="button"
      onClick={onRecheck}
      title={title}
      className="inline-flex items-center gap-2 rounded-lg border border-rule bg-surface px-2.5 py-1.5 text-[12.5px] text-ink2 hover:border-rule-strong"
    >
      <span className={`h-2 w-2 rounded-full ${HEALTH_DOT[health]}`} aria-hidden="true" />
      <span>{HEALTH_TEXT[health]}</span>
      {health === 'up' && info ? (
        <span className="hidden font-mono text-[11.5px] tabular-nums text-ink3 sm:inline">{info.kb_chunks} chunks</span>
      ) : null}
    </button>
  )
}

export function AppShell({
  health,
  info,
  onRecheck,
  theme,
  onToggleTheme,
  children,
}: {
  health: Health
  info: HealthResponse | null
  onRecheck: () => void
  theme: Theme
  onToggleTheme: () => void
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-rule bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[860px] items-center gap-3 px-4 py-2.5 sm:px-6">
          <span className="logo-tile grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white">
            <IconMaze size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold leading-tight tracking-tight text-ink">Study Maze</p>
            <p className="truncate text-[12px] leading-tight text-ink3">Your 24/7 online study buddy</p>
          </div>
          <HealthBadge health={health} info={info} onRecheck={onRecheck} />
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="grid h-8 w-8 place-items-center rounded-lg border border-rule bg-surface text-ink2 hover:border-rule-strong hover:text-ink"
          >
            {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[860px] px-4 py-6 sm:px-6 sm:py-10">{children}</main>

      <footer className="mx-auto max-w-[860px] px-4 pb-8 pt-2 text-center text-[12px] text-ink3 sm:px-6">
        Answers are generated only from the official documentation indexed for the selected chip. Verify critical values against the
        official datasheet before committing a hardware design.
      </footer>
    </div>
  )
}
