import { useEffect, useMemo, useState } from 'react'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  Button,
  Icon,
  Card,
  Panel,
  PillTabs,
  usePagination,
  Label,
  Input,
  Select,
  Textarea,
  Hint,
  type PillTabItem,
} from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { cn } from '@/lib/cn'
import {
  MEETINGS,
  TYPE,
  MODE,
  MEETING_TYPES,
  MODE_OPTIONS,
  EVENT_OPTIONS,
  shortDate,
  type Meeting,
  type MeetingType,
} from '../data/meetings'

type MeetingTab = 'all' | 'today' | 'upcoming' | 'past'

function ModeBadge({ m }: { m: Meeting }) {
  if (m.mode === 'Video') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
        <i className="hgi-stroke hgi-video-01 text-[12px]" />
        Google Meet
      </span>
    )
  }
  const mo = MODE[m.mode]
  return (
    <span className={cn('badge', mo.badge)}>
      <i className={cn('hgi-stroke', mo.icon, 'text-[12px]')} />
      {mo.label}
    </span>
  )
}

function WhereLine({ m }: { m: Meeting }) {
  if (m.mode === 'Video') {
    return (
      <>
        <i className="hgi-stroke hgi-video-01 text-[13px]" />
        <a
          href={'https://' + m.link}
          target="_blank"
          rel="noopener"
          className="font-medium text-brand hover:underline"
        >
          {m.link}
        </a>
      </>
    )
  }
  return (
    <>
      <i
        className={cn(
          'hgi-stroke',
          m.mode === 'In person' ? 'hgi-location-01' : 'hgi-call-02',
          'text-[13px]',
        )}
      />
      {m.where}
    </>
  )
}

export default function MeetingsPage() {
  const panel = useDisclosure()

  const [q, setQ] = useState('')
  const [tab, setTab] = useState<MeetingTab>('all')
  const [type, setType] = useState<'' | MeetingType>('') // '' = All types

  const counts = useMemo(() => {
    const c = { all: MEETINGS.length, today: 0, upcoming: 0, past: 0 }
    for (const m of MEETINGS) c[m.bucket]++
    return c
  }, [])

  const tabs: PillTabItem<MeetingTab>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'today', label: 'Today', count: counts.today },
    { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { value: 'past', label: 'Past', count: counts.past },
  ]

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return MEETINGS.filter((m) => {
      if (tab !== 'all' && m.bucket !== tab) return false
      if (type && m.type !== type) return false
      if (
        query &&
        (m.title + ' ' + m.person + ' ' + m.role + ' ' + m.event + ' ' + m.type)
          .toLowerCase()
          .indexOf(query) === -1
      )
        return false
      return true
    })
  }, [q, tab, type])

  const pager = usePagination(filtered)
  const { setPage } = pager
  useEffect(() => setPage(1), [q, tab, type, setPage])

  return (
    <>
      <PageHeader
        title="Meetings"
        subtitle="Calls and walkthroughs with speakers, sponsors, venues & vendors."
        actions={
          <>
            <span
              className="hidden items-center gap-1.5 rounded-lg border border-hair bg-surface px-2.5 py-1.5 text-[12px] font-medium text-muted lg:inline-flex"
              title="Meetings sync with your Google Calendar"
            >
              <i className="hgi-stroke hgi-checkmark-badge-01 text-[14px] text-brand" />
              Google Calendar
            </span>
            <Button variant="primary" className="shrink-0" onClick={panel.onOpen}>
              <Icon name="hgi-calendar-add-01" size={16} />
              <span className="hidden sm:inline">Schedule meeting</span>
              <span className="sm:hidden">Schedule</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* status tabs (out of list) */}
      <PillTabs items={tabs} value={tab} onChange={setTab} />

      {/* search + filter (out of list) */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search meetings, people or events…"
          />
        </div>
        <div className="relative w-full sm:w-52">
          <i className="hgi-stroke hgi-user-group text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as '' | MeetingType)}
            className="select h-10 w-full border-0 bg-surface pl-9 font-medium"
            aria-label="Meeting type"
          >
            <option value="">All types</option>
            {MEETING_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* list */}
      <Card className="mt-3 p-2 sm:p-3">
        <div className="divide-y divide-line">
          {pager.slice.map((m, i) => {
            const t = TYPE[m.type]
            const when = m.bucket === 'today' ? 'Today' : shortDate(m.date)
            return (
              <div key={m.title + i} className="flex items-start gap-3.5 px-2 py-3.5">
                <span
                  className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                    t.tint,
                  )}
                >
                  <i className={cn('hgi-stroke', t.icon, 'text-[19px]')} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-ink">{m.title}</p>
                    <ModeBadge m={m} />
                    {m.bucket === 'today' ? (
                      <span className="badge badge-green">Today</span>
                    ) : m.bucket === 'past' ? (
                      <span className="badge badge-gray">Past</span>
                    ) : null}
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted tnum">
                    <i className="hgi-stroke hgi-clock-01 text-[13px]" />
                    {when} · {m.start} – {m.end}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {m.role} · <span className="font-medium text-ink">{m.person}</span> · {m.event}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                    <WhereLine m={m} />
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {m.mode === 'Video' && m.bucket !== 'past' && (
                    <a
                      href={'https://' + m.link}
                      target="_blank"
                      rel="noopener"
                      className="btn btn-soft btn-sm"
                    >
                      <i className="hgi-stroke hgi-video-01 text-[14px]" />
                      <span className="hidden sm:inline">Join</span>
                    </a>
                  )}
                  <button
                    onClick={panel.onOpen}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-line hover:text-ink"
                    title="Edit meeting"
                  >
                    <i className="hgi-stroke hgi-edit-02 text-[15px]" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {pager.total === 0 && (
          <p className="py-12 text-center text-[13px] text-muted">
            No meetings match your filters.
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center justify-between gap-3 px-2 pb-1 text-[12px] text-muted">
          <p>
            {pager.total ? (
              <>
                Showing{' '}
                <b className="text-ink">
                  {pager.from}–{pager.to}
                </b>{' '}
                of <b className="text-ink tnum">{pager.total}</b> meetings
              </>
            ) : (
              'No meetings'
            )}
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 whitespace-nowrap">
              Rows per page
              <select
                value={pager.size}
                onChange={(e) => pager.setSize(Number(e.target.value))}
                className="select h-8 w-auto min-w-[3.75rem] py-0 pl-2.5 pr-7 text-[12px] font-medium text-ink"
              >
                <option>10</option>
                <option>20</option>
                <option>30</option>
                <option>50</option>
              </select>
            </label>
            <div className="flex gap-1">
              <button
                className="btn btn-soft btn-sm"
                type="button"
                aria-label="Previous page"
                disabled={pager.total === 0 || pager.page === 1}
                onClick={() => pager.setPage(pager.page - 1)}
              >
                <i className="hgi-stroke hgi-arrow-left-01 text-[14px]" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <button
                className="btn btn-soft btn-sm"
                type="button"
                aria-label="Next page"
                disabled={pager.total === 0 || pager.page >= pager.pageCount}
                onClick={() => pager.setPage(pager.page + 1)}
              >
                <span className="hidden sm:inline">Next</span>
                <i className="hgi-stroke hgi-arrow-right-01 text-[14px]" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      <PageFooter />

      {/* schedule meeting slide-over */}
      <Panel
        open={panel.open}
        onClose={panel.onClose}
        title="Schedule meeting"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={panel.onClose}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={panel.onClose}>
              <Icon name="hgi-calendar-add-01" size={16} />
              Schedule meeting
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input type="text" placeholder="e.g. Seating plan approval" />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="text" defaultValue="Jul 19, 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start</Label>
              <Input type="text" className="tnum" defaultValue="10:00 AM" />
            </div>
            <div>
              <Label>End</Label>
              <Input type="text" className="tnum" defaultValue="10:30 AM" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select>
                {MEETING_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Mode</Label>
              <Select>
                {MODE_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
              <Hint>A Meet link is generated automatically.</Hint>
            </div>
          </div>
          <div>
            <Label>With</Label>
            <Input
              type="text"
              placeholder="Name · role (e.g. Sophia Reynolds · Venue Coordinator)"
            />
          </div>
          <div>
            <Label>Related event</Label>
            <Select>
              {EVENT_OPTIONS.map((ev) => (
                <option key={ev}>{ev}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea placeholder="Agenda, dial-in link, or anything to prepare…" />
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-hair bg-canvas p-3">
            <i className="hgi-stroke hgi-calendar-check-in-01 mt-0.5 text-[16px] text-muted" />
            <p className="text-[12px] text-muted">
              A <span className="font-medium text-ink">Google Meet</span> link and{' '}
              <span className="font-medium text-ink">Google Calendar</span> invite are emailed to
              each guest, with a reminder 15 minutes before.
            </p>
          </div>
        </div>
      </Panel>
    </>
  )
}
