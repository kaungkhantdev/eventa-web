import { useFetcher, useLoaderData } from 'react-router'
import { Card, HeaderUser, Icon, PageFooter, PageHeader } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ActionResult } from '@/app/loaders'
import type { NotificationsData } from '../settings.routes'
import type { NotificationRow } from '../settings.types'

/**
 * What Eventa emails and texts you (US-DISC-14). Ported from the kit.
 *
 * SMS being unavailable and SMS being switched off are different facts: one is
 * the product not offering it for that category, the other is a choice. An
 * unavailable channel is shown as unavailable rather than as an off switch
 * that silently does nothing.
 */
export default function SettingsNotificationsPage() {
  const data = useLoaderData() as NotificationsData

  return (
    <>
      <PageHeader
        title="Notification preferences"
        subtitle="Choose what Eventa emails and alerts you receive."
        actions={<HeaderUser />}
      />

      <Card className="p-2 sm:p-3">
        <div className="divide-y divide-line">
          {data.rows.map((row) => (
            <PreferenceRow key={row.category} row={row} />
          ))}
        </div>
      </Card>

      <PageFooter />
    </>
  )
}

function PreferenceRow({ row }: { row: NotificationRow }) {
  const toggle = useFetcher<ActionResult>()
  const busy = toggle.state !== 'idle'

  const set = (channel: 'email' | 'sms', enabled: boolean) =>
    toggle.submit(
      { category: row.category, channel, enabled: String(enabled) },
      { method: 'post' },
    )

  return (
    <div className="flex items-center gap-4 px-2 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">{row.title}</p>
        <p className="mt-0.5 text-[12px] text-muted">{row.description}</p>
        {toggle.data?.ok === false && (
          <p role="alert" className="mt-1 text-[12px] text-red-500">
            {toggle.data.error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ChannelToggle
          label={`Email ${row.title}`}
          icon="hgi-mail-01"
          on={row.emailEnabled}
          disabled={busy}
          onChange={(next) => set('email', next)}
        />
        {row.smsAvailable ? (
          <ChannelToggle
            label={`SMS ${row.title}`}
            icon="hgi-message-01"
            on={row.smsEnabled}
            disabled={busy}
            onChange={(next) => set('sms', next)}
          />
        ) : (
          <span
            className="grid h-9 w-9 place-items-center rounded-lg text-muted/40"
            title="SMS is not available for this notification"
          >
            <Icon name="hgi-message-01" size={16} />
          </span>
        )}
      </div>
    </div>
  )
}

function ChannelToggle({
  label,
  icon,
  on,
  disabled,
  onChange,
}: {
  label: string
  icon: string
  on: boolean
  disabled: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-lg transition',
        on ? 'bg-brand-soft text-brand' : 'bg-canvas text-muted hover:text-ink',
      )}
    >
      <Icon name={icon} size={16} />
    </button>
  )
}
