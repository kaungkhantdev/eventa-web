import { useState, type FormEvent } from 'react'
import { useFilters } from '@/lib/useFilters'
import type { ReportPeriodWire } from '../insights.types'
import { dateRangePatch, trimmedNote } from '../reportPeriod'
import { DATE_INPUT } from '@/lib/constants/insights.constants'

/**
 * A start and an end date for the report (US-RPT-02).
 *
 * The inputs open on the window the report actually covered — the API's own
 * resolved period, so a trimmed span shows the days that were used rather than
 * the ones asked for. Nothing is written to the URL until Apply, and a
 * backwards pair is refused with the story's sentence while the result on
 * screen stays as it was (AC2). A span the API trimmed says so beneath (AC3).
 */
export function ReportDateRange({ period }: { period: ReportPeriodWire }) {
  const { set } = useFilters()
  const [from, setFrom] = useState(period.from)
  const [to, setTo] = useState(period.to)
  const [error, setError] = useState<string | null>(null)

  // Adjusted during render, as `useSearchBox` does: when the URL moves
  // underneath (back button, cleared filters), the inputs show the new window
  // on this paint instead of the old one.
  const shown = `${period.from}|${period.to}`
  const [seen, setSeen] = useState(shown)
  if (shown !== seen) {
    setSeen(shown)
    setFrom(period.from)
    setTo(period.to)
    setError(null)
  }

  const apply = (event: FormEvent) => {
    event.preventDefault()
    const result = dateRangePatch(from, to)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    set(result.patch)
  }

  const note = trimmedNote(period)
  return (
    <form onSubmit={apply} className="flex flex-col gap-1" noValidate>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className={DATE_INPUT}
          aria-label="Start date"
        />
        <span className="text-[13px] text-muted">–</span>
        <input
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className={DATE_INPUT}
          aria-label="End date"
        />
        <button type="submit" className="btn btn-ghost h-10 shrink-0">
          Apply
        </button>
      </div>
      {error && (
        <p role="alert" className="text-[12px] text-red-500">
          {error}
        </p>
      )}
      {note && <p className="text-[12px] text-muted">{note}</p>}
    </form>
  )
}
