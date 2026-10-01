import { useState } from 'react'
import { Link } from 'react-router'
import { Icon, PanelEmptyPreview, type EmptyAction } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { TodayRegistrations } from '../overview.types'
import { CountBadge, SectionHeader } from './PanelChrome'

/**
 * Today's sign-ups (US-DASH-02). Markup ported from admin/home.html.
 *
 * The whole panel is absent — not empty, not zero — for someone who may not see
 * attendee personal data; `today` is null in that case and the page omits it.
 */

const REGISTRATIONS = '/admin/registrations'
const NEW_EVENT = '/admin/event-form'
const NOTHING_YET = 'Share your registration link and new attendees appear here in real time.'
/** Long enough to read, short enough that the button is ready for a second copy. */
const COPIED_MS = 1500

type CopyState = 'idle' | 'copied' | 'failed'

export function TodayRegistrationsPanel({
  today,
  shareUrl,
}: {
  today: TodayRegistrations
  /** The public page of the event worth promoting, or null when there is none. */
  shareUrl: string | null
}) {
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const empty = today.emptyMessage !== null

  const copy = () => {
    if (!shareUrl) return
    // The outcome is reported either way. Saying "Link copied" when the browser
    // refused the clipboard sends someone off to paste nothing.
    void navigator.clipboard
      ?.writeText(shareUrl)
      .then(
        () => setCopyState('copied'),
        () => setCopyState('failed'),
      )
      .finally(() => setTimeout(() => setCopyState('idle'), COPIED_MS))
  }

  return (
    <section className="rounded-2xl bg-surface p-4">
      <SectionHeader
        title="Today's Registrations"
        badge={<CountBadge value={today.count} tone="brand" />}
        link={{ to: REGISTRATIONS, label: 'See all' }}
      />

      {empty ? (
        <PanelEmptyPreview
          preview="registrations"
          description={NOTHING_YET}
          action={shareAction(shareUrl, copyState, copy)}
        >
          {today.emptyMessage}
        </PanelEmptyPreview>
      ) : (
        <div className="mt-3.5 space-y-3.5">
          {today.rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2.5">
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
                  r.tint,
                )}
              >
                {r.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{r.name}</p>
                <p className="truncate text-[12px] text-muted">{r.detail}</p>
              </div>
              <span className="tnum shrink-0 text-[11px] text-muted">{r.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hidden while empty: the card already offers its one next step, and
          "view all" of nothing is a dead end. */}
      {!empty && (
        <Link
          to={REGISTRATIONS}
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-brand-dark"
        >
          <Icon name="hgi-user-add-01" size={15} />
          View all registrations
        </Link>
      )}
    </section>
  )
}

/**
 * The card's next step: share the event that is waiting on sign-ups, or make
 * one when there is no event to share.
 */
function shareAction(shareUrl: string | null, state: CopyState, copy: () => void): EmptyAction {
  if (!shareUrl) {
    return { label: 'New event', icon: 'hgi-calendar-add-01', to: NEW_EVENT }
  }
  if (state === 'copied') {
    return { label: 'Link copied', icon: 'hgi-checkmark-circle-02', onClick: copy }
  }
  if (state === 'failed') {
    return { label: 'Copy failed — try again', icon: 'hgi-copy-01', onClick: copy }
  }
  return { label: 'Copy registration link', icon: 'hgi-copy-01', onClick: copy }
}
