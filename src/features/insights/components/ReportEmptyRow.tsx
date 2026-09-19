import { EmptyState, NoResults, PastEnd } from '@/components/ui'
import type { ReactNode } from 'react'
import type { ListEmptyReason } from '@/lib/urlFilters'

/**
 * What a report's table shows instead of rows.
 *
 * Three states, because an empty table means three different things and only
 * one of them is the reader's doing:
 *
 *   · **past-end** — they are standing on page 4 of a two-page result. The rows
 *     exist; blaming filters would be wrong.
 *   · **no-results** — a filter is hiding them, so the way out is to widen it.
 *   · **first-run** — the window genuinely holds nothing. Nothing can be added
 *     from a report, so the way forward is the events screen.
 *
 * Shared by all four report tables: the distinction is the same on every one of
 * them, and a bare "No X for this selection" — which is what the static kit had
 * and what these pages were ported with — is the dead card `EmptyState` exists
 * to replace.
 */
export function ReportEmptyRow({
  colSpan,
  noun,
  reason,
  onClear,
  children,
}: {
  colSpan: number
  /** Plural, in the page's own words: "events", "registrations". */
  noun: string
  reason: ListEmptyReason
  onClear: () => void
  /** The page's own sentence for the filtered case, naming its own filters. */
  children?: ReactNode
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        {reason === 'past-end' ? (
          <PastEnd noun={noun} onFirstPage={onClear} />
        ) : reason === 'no-results' ? (
          <NoResults noun={noun} onClear={onClear}>
            {children}
          </NoResults>
        ) : (
          <EmptyState
            compact
            icon="hgi-analytics-up"
            title={`No ${noun} in this period`}
            actions={[
              { label: 'See your events', to: '/admin/events', icon: 'hgi-calendar-03' },
            ]}
          >
            A report describes what has already happened, so there is nothing to
            add here. Widen the date range, or start from your events.
          </EmptyState>
        )}
      </td>
    </tr>
  )
}
