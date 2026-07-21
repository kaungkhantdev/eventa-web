import { useState } from 'react'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  Button,
  Icon,
  Card,
  Panel,
  Label,
  Input,
  Select,
  Textarea,
  Hint,
  EventPicker,
} from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { cn } from '@/lib/cn'
import { num } from '@/lib/format'
import {
  ANNOUNCEMENTS,
  ANNOUNCEMENT_AUDIENCES,
  type Announcement,
} from '../data/announcements'

const STATUS_BADGE: Record<Announcement['status'], { cls: string; icon: string; label: string }> = {
  sent: { cls: 'badge-green', icon: 'hgi-tick-02', label: 'Sent' },
  scheduled: { cls: 'badge-blue', icon: 'hgi-time-schedule', label: 'Scheduled' },
}

const ICON_WRAP: Record<Announcement['status'], string> = {
  sent: 'bg-brand-soft text-brand',
  scheduled: 'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300',
}

export default function MessagingAnnouncementsPage() {
  const panel = useDisclosure()
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>('now')
  const [announceEvent, setAnnounceEvent] = useState('All events')

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Broadcasts sent to registrants, checked-in attendees or your waitlist."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={panel.onOpen}>
              <Icon name="hgi-megaphone-01" />
              <span className="hidden sm:inline">Send announcement</span>
              <span className="sm:hidden">Send</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* ============ ANNOUNCEMENTS ============ */}
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Sent announcements</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Broadcast messages sent to registrants, checked-in attendees or your waitlist.
            </p>
          </div>
          <Button variant="primary" size="sm" className="shrink-0" onClick={panel.onOpen}>
            <Icon name="hgi-megaphone-01" size={14} />
            Send announcement
          </Button>
        </div>
      </Card>

      <Card className="mt-3 p-4">
        {ANNOUNCEMENTS.map((a, i) => {
          const badge = STATUS_BADGE[a.status]
          return (
            <div
              key={a.title + a.date}
              className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line')}
            >
              <span
                className={cn(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                  ICON_WRAP[a.status],
                )}
              >
                <i className="hgi-stroke hgi-megaphone-01 text-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{a.title}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted tnum">
                  {a.event} · {num(a.recipients)} recipients · {a.date}
                </p>
              </div>
              <div className="hidden items-center gap-1.5 sm:flex">
                {a.channels.includes('email') && (
                  <span className="badge badge-blue">
                    <i className="hgi-stroke hgi-mail-01 text-[12px]" />
                    Email
                  </span>
                )}
                {a.channels.includes('sms') && (
                  <span className="badge badge-green">
                    <i className="hgi-stroke hgi-smart-phone-01 text-[12px]" />
                    SMS
                  </span>
                )}
              </div>
              <span className={cn('badge shrink-0', badge.cls)}>
                <i className={cn('hgi-stroke', badge.icon, 'text-[12px]')} />
                {badge.label}
              </span>
            </div>
          )
        })}
      </Card>

      <PageFooter />

      {/* Send announcement panel */}
      <Panel
        open={panel.open}
        onClose={panel.onClose}
        title="Send announcement"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={panel.onClose}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={panel.onClose}>
              Send
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Event</Label>
            <div className="relative">
              <EventPicker value={announceEvent} onChange={setAnnounceEvent} />
            </div>
          </div>
          <div>
            <Label>Audience</Label>
            <Select defaultValue={ANNOUNCEMENT_AUDIENCES[0]}>
              {ANNOUNCEMENT_AUDIENCES.map((aud) => (
                <option key={aud}>{aud}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Channel</Label>
            <div className="flex gap-2">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-hair px-3 py-2 text-[13px] text-ink">
                <input type="checkbox" className="h-3.5 w-3.5 accent-brand" defaultChecked />
                <i className="hgi-stroke hgi-mail-01 text-[15px] text-muted" />
                Email
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-hair px-3 py-2 text-[13px] text-ink">
                <input type="checkbox" className="h-3.5 w-3.5 accent-brand" defaultChecked />
                <i className="hgi-stroke hgi-smart-phone-01 text-[15px] text-muted" />
                SMS
              </label>
            </div>
          </div>
          <div>
            <Label>Subject</Label>
            <Input type="text" placeholder="e.g. Venue change for Tech Summit 2026" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea placeholder="Write your announcement…" rows={5} />
            <Hint>
              Recipients receive this as an email and/or SMS depending on the channels selected
              above.
            </Hint>
          </div>
          <div>
            <Label>Delivery</Label>
            <div className="segmented w-full">
              <button
                type="button"
                className={cn('flex-1', sendMode === 'now' && 'active')}
                onClick={() => setSendMode('now')}
              >
                Send now
              </button>
              <button
                type="button"
                className={cn('flex-1', sendMode === 'schedule' && 'active')}
                onClick={() => setSendMode('schedule')}
              >
                Schedule
              </button>
            </div>
          </div>
          {sendMode === 'schedule' && (
            <div>
              <Label>Send date &amp; time</Label>
              <Input type="datetime-local" />
            </div>
          )}
        </div>
      </Panel>
    </>
  )
}
