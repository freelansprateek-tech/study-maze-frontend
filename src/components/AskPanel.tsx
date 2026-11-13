import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import { QUESTION_MAX_LENGTH, QUESTION_MIN_LENGTH } from '../api'
import type { ChipId, ChipInfo } from '../api-types'
import { IconBluetooth, IconChevron, IconCpu, IconRadio, IconSend, IconUsb, IconWifi } from './icons'

/**
 * THE ASK PANEL - chip and question in one place
 *
 * The chip is still mandatory: the select has no default value, and the
 * question box and the Ask button stay disabled until a chip is chosen.
 * A native <select> on purpose: it is keyboard- and screen-reader-complete
 * and opens the platform picker on phones.
 *
 * The sample prompts come from the backend with the chip, so they are always
 * questions the selected chip's documentation can answer.
 */

function Spec({ icon, children, muted }: { icon: ReactNode; children: ReactNode; muted?: boolean }) {
  return (
    <li
      className={`inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper px-2.5 py-1 text-[12px] leading-tight ${
        muted ? 'text-ink3' : 'text-ink2'
      }`}
    >
      <span className={`shrink-0 ${muted ? 'text-ink3' : 'text-accent'}`}>{icon}</span>
      {children}
    </li>
  )
}

function ChipSpecs({ chip }: { chip: ChipInfo }) {
  const noBluetooth = /^no\b/i.test(chip.bluetooth)
  const noUsb = /^no\b/i.test(chip.usb)
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`${chip.label} hardware summary`}>
      <Spec icon={<IconCpu size={13} />}>
        {chip.cores} {chip.architecture}, {chip.max_frequency_mhz} MHz
      </Spec>
      <Spec icon={<IconWifi size={13} />}>{chip.wifi}</Spec>
      <Spec icon={<IconBluetooth size={13} />} muted={noBluetooth}>
        {chip.bluetooth}
      </Spec>
      <Spec icon={<IconUsb size={13} />} muted={noUsb}>
        {chip.usb}
      </Spec>
      {chip.extra_radio ? <Spec icon={<IconRadio size={13} />}>{chip.extra_radio}</Spec> : null}
      <Spec icon={<IconCpu size={13} />}>{chip.gpio_count} GPIOs</Spec>
    </ul>
  )
}

export function AskPanel({
  chips,
  chip,
  selectedChip,
  onChipChange,
  question,
  onQuestionChange,
  loading,
  onSubmit,
  onCancel,
}: {
  chips: ChipInfo[]
  chip: ChipInfo | null
  selectedChip: ChipId | ''
  onChipChange: (chip: ChipId | '') => void
  question: string
  onQuestionChange: (value: string) => void
  loading: boolean
  onSubmit: () => void
  onCancel: () => void
}) {
  const locked = chip === null
  const trimmed = question.trim()
  const canSubmit = !locked && !loading && trimmed.length >= QUESTION_MIN_LENGTH

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (canSubmit) onSubmit()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card p-4 sm:p-6">
      <label htmlFor="chip-select" className="mb-1.5 block text-[13px] font-medium text-ink">
        Chip or board
      </label>
      <div className="relative sm:max-w-[360px]">
        <select
          id="chip-select"
          required
          value={selectedChip}
          disabled={loading || chips.length === 0}
          onChange={(e) => onChipChange(e.target.value as ChipId | '')}
          className={`field h-11 appearance-none pl-3 pr-10 text-[14px] font-medium ${selectedChip ? '' : 'text-ink3'}`}
        >
          <option value="">{chips.length ? 'Select a chip or board…' : 'Loading chips…'}</option>
          {chips.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label} — {c.cores} {c.architecture}
            </option>
          ))}
        </select>
        <IconChevron size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink3" />
      </div>
      {chip ? <ChipSpecs chip={chip} /> : null}

      <label htmlFor="question" className="mb-1.5 mt-5 block text-[13px] font-medium text-ink">
        Question
      </label>
      <textarea
        id="question"
        rows={3}
        value={question}
        maxLength={QUESTION_MAX_LENGTH}
        disabled={locked || loading}
        onChange={(e) => onQuestionChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={locked ? 'Select a chip or board above to start' : `Ask anything about the ${chip.label}`}
        className="field resize-y px-3.5 py-3 text-[15px] leading-relaxed placeholder:text-ink3"
      />

      {chip ? (
        <div className="mt-3">
          <p className="mb-1.5 text-[12px] text-ink3">Try one of these</p>
          <ul className="flex flex-wrap gap-1.5">
            {chip.sample_questions.map((sample) => (
              <li key={sample} className="max-w-full">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onQuestionChange(sample)}
                  className={`max-w-full rounded-2xl border px-3 py-1.5 text-left text-[12.5px] leading-snug transition-colors disabled:opacity-60 ${
                    sample === question
                      ? 'border-accent/50 bg-accent-soft text-ink'
                      : 'border-rule bg-paper text-ink2 hover:border-accent/40 hover:text-ink'
                  }`}
                >
                  {sample}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-[12.5px] text-ink3 sm:text-left">
          {locked
            ? 'Answers use only the selected chip’s official documentation.'
            : loading
              ? 'Reading the documentation…'
              : trimmed.length < QUESTION_MIN_LENGTH
                ? 'Type a question or pick a sample.'
                : 'Ctrl/⌘ + Enter to send.'}
        </p>
        <div className="flex gap-2">
          {loading ? (
            <button
              type="button"
              onClick={onCancel}
              className="h-11 rounded-xl border border-rule-strong bg-surface px-4 text-[14px] font-medium text-ink2 hover:text-ink"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-[14px] font-semibold text-accent-ink shadow-sm transition-colors hover:bg-accent-mid disabled:bg-sunk disabled:text-ink3 disabled:shadow-none sm:flex-none"
          >
            {loading ? <span className="spinner" aria-hidden="true" /> : <IconSend size={15} />}
            {loading ? 'Working…' : 'Ask'}
          </button>
        </div>
      </div>
    </form>
  )
}
