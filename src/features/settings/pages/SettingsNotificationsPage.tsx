import { useState } from 'react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/cn'
import { SettingsHeader } from '../components/SettingsHeader'
import { NOTIF_CATEGORIES } from '../data/notifications'

/** Pill toggle matching the notification-row switches (no transition classes,
 *  exactly as the source markup). */
function NotifSwitch({ on, onToggle, title }: { on: boolean; onToggle: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      className={cn('flex h-5 w-9 items-center rounded-full p-0.5', on ? 'bg-brand' : 'bg-line')}
    >
      <span className={cn('h-4 w-4 rounded-full bg-white shadow', on && 'translate-x-4')} />
    </button>
  )
}

type Channel = 'email' | 'sms'

export default function SettingsNotificationsPage() {
  const [prefs, setPrefs] = useState(() =>
    NOTIF_CATEGORIES.map((c) => ({ email: c.email, sms: c.sms })),
  )

  const toggle = (idx: number, channel: Channel) =>
    setPrefs((rows) =>
      rows.map((row, i) => (i === idx ? { ...row, [channel]: !row[channel] } : row)),
    )

  return (
    <>
      <SettingsHeader
        title="Notification preferences"
        subtitle="Choose what Eventa emails and alerts you receive."
      />

      <div className="space-y-3">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold tracking-tight">What you get notified about</h2>
            <div className="hidden items-center gap-6 pr-1 text-[11px] font-semibold text-muted sm:flex">
              <span className="w-9 text-center">Email</span>
              <span className="w-9 text-center">SMS</span>
            </div>
          </div>
          <p className="mt-0.5 text-[12px] text-muted">
            Choose how you want to be notified for each category.
          </p>
          <div className="mt-2 divide-y divide-line">
            {NOTIF_CATEGORIES.map((cat, idx) => (
              <div
                key={cat.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                      cat.iconChip,
                    )}
                  >
                    <i className={cn('hgi-stroke', cat.icon, 'text-[16px]')} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{cat.title}</p>
                    <p className="text-[11px] text-muted">{cat.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <NotifSwitch
                    on={prefs[idx]!.email}
                    onToggle={() => toggle(idx, 'email')}
                    title="Email"
                  />
                  <NotifSwitch
                    on={prefs[idx]!.sms}
                    onToggle={() => toggle(idx, 'sms')}
                    title="SMS"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
