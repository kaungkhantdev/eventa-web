import { useFetcher, useLoaderData } from 'react-router'
import { Card, Icon, PageFooter } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ActionResult } from '@/app/loaders'
import { SettingsHeader } from '../components/SettingsHeader'
import { Toggle } from '../components/Toggle'
import type { NotificationsData } from '../settings.routes'
import type { NotificationRow } from '../settings.types'

/**
 * What Eventa emails and texts you (US-DISC-14), ported from
 * `eventa-ui-kit/admin/settings-notifications.html`.
 *
 * The kit draws four categories; the API has seven, and the API is the truth.
 * What is ported is the presentation — the icon tile, the Email/SMS columns and
 * the switches — applied to every category that actually exists. Dropping three
 * to match a mockup would hide preferences somebody can already have set.
 *
 * SMS being unavailable and SMS being switched off are different facts: one is
 * the product not offering it for that category, the other is a choice. An
 * unavailable channel reads as unavailable rather than as an off switch that
 * silently does nothing.
 */
export default function SettingsNotificationsPage() {
  const data = useLoaderData() as NotificationsData

  return (
    <>
      <SettingsHeader
        title="Notification preferences"
        subtitle="Choose what Eventa emails and alerts you receive."
      />

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-bold tracking-tight">What you get notified about</h2>
          {/* Hidden on small screens, as the kit does: the columns only label
              switches that have room to sit under them. */}
          <div className="hidden items-center gap-6 pr-1 text-[11px] font-semibold text-muted sm:flex">
            <span className="w-9 text-center">Email</span>
            <span className="w-9 text-center">SMS</span>
          </div>
        </div>
        <p className="mt-0.5 text-[12px] text-muted">
          Choose how you want to be notified for each category.
        </p>

        <div className="mt-2 divide-y divide-line">
          {data.rows.map((row) => (
            <PreferenceRow key={row.category} row={row} />
          ))}
        </div>
      </Card>

      <PageFooter />
    </>
  )
}

/**
 * A tile per category. The kit tints the ones that matter to running an event
 * and leaves the rest neutral — product updates are not an operational signal,
 * and colouring them the same would say they were.
 */
const CATEGORY_ICONS: Record<string, { icon: string; muted?: boolean }> = {
  registration: { icon: 'hgi-user-add-01' },
  payment: { icon: 'hgi-wallet-01' },
  sales: { icon: 'hgi-tag-01' },
  feedback: { icon: 'hgi-star' },
  payout: { icon: 'hgi-bank' },
  alert: { icon: 'hgi-alert-02' },
  task: { icon: 'hgi-time-schedule', muted: true },
}

const FALLBACK_ICON = { icon: 'hgi-megaphone-01', muted: true }

function PreferenceRow({ row }: { row: NotificationRow }) {
  const toggle = useFetcher<ActionResult>()
  const busy = toggle.state !== 'idle'
  const look = CATEGORY_ICONS[row.category] ?? FALLBACK_ICON

  const set = (channel: 'email' | 'sms', enabled: boolean) =>
    toggle.submit(
      { category: row.category, channel, enabled: String(enabled) },
      { method: 'post' },
    )

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
            look.muted ? 'bg-line text-muted' : 'bg-brand-soft text-brand',
          )}
        >
          <Icon name={look.icon} size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink">{row.title}</p>
          <p className="text-[11px] text-muted">{row.description}</p>
          {toggle.data?.ok === false && (
            <p role="alert" className="mt-1 text-[12px] text-red-500">
              {toggle.data.error}
            </p>
          )}
        </div>
      </div>

      {/* `gap-6` and `w-9` match the column headers above, so each switch sits
          under the word that names it. */}
      <div className="flex shrink-0 items-center gap-6">
        <span className="grid w-9 place-items-center">
          <Toggle
            on={row.emailEnabled}
            disabled={busy}
            onChange={(next) => set('email', next)}
            label={`Email me about ${row.title}`}
          />
        </span>
        <span className="grid w-9 place-items-center">
          {row.smsAvailable ? (
            <Toggle
              on={row.smsEnabled}
              disabled={busy}
              onChange={(next) => set('sms', next)}
              label={`Text me about ${row.title}`}
            />
          ) : (
            /* Not a switch. A disabled toggle reads as "off, and you could turn
               it on" — this channel does not exist for this category at all. */
            <span className="text-[11px] text-muted/60" title="SMS is not offered for this one">
              —
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
