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
  Paginator,
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
  ATTENDEES,
  TAG_BADGE,
  ATT_TAGS,
  ATT_EVENTS,
  type Attendee,
  type AttendeeTab,
  type AttendeeSort,
} from '../data/attendees'

const SORT_LABEL: Record<AttendeeSort, string> = {
  activity: 'Sort: Last activity',
  name: 'Sort: Name (A–Z)',
  events: 'Sort: Most events',
  tickets: 'Sort: Most tickets',
}

function sortList(list: Attendee[], sort: AttendeeSort): Attendee[] {
  const l = list.slice()
  if (sort === 'name') l.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort === 'events') l.sort((a, b) => b.events - a.events || b.ts - a.ts)
  else if (sort === 'tickets') l.sort((a, b) => b.tickets - a.tickets || b.ts - a.ts)
  else l.sort((a, b) => b.ts - a.ts)
  return l
}

export default function AttendeesPage() {
  const profile = useDisclosure()
  const invite = useDisclosure()

  const [q, setQ] = useState('')
  const [tab, setTab] = useState<AttendeeTab>('all')
  const [tag, setTag] = useState('') // '' = All tags
  const [sort, setSort] = useState<AttendeeSort>('activity')

  const counts = useMemo(() => {
    let nw = 0
    let ci = 0
    let vip = 0
    for (const a of ATTENDEES) {
      if (a.isNew) nw++
      if (a.checkedIn) ci++
      if (a.tag === 'VIP') vip++
    }
    return { all: ATTENDEES.length, new: nw, checkedin: ci, vip }
  }, [])

  const tabs: PillTabItem<AttendeeTab>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'new', label: 'New', count: counts.new },
    { value: 'checkedin', label: 'Checked-in', count: counts.checkedin },
    { value: 'vip', label: 'VIPs', count: counts.vip },
  ]

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const byTab = (a: Attendee) => {
      if (tab === 'new') return a.isNew
      if (tab === 'checkedin') return a.checkedIn
      if (tab === 'vip') return a.tag === 'VIP'
      return true
    }
    const list = ATTENDEES.filter(byTab)
      .filter((a) => !tag || a.tag === tag)
      .filter(
        (a) =>
          !query ||
          a.name.toLowerCase().indexOf(query) >= 0 ||
          a.email.toLowerCase().indexOf(query) >= 0,
      )
    return sortList(list, sort)
  }, [q, tab, tag, sort])

  const pager = usePagination(filtered)
  const { setPage } = pager
  useEffect(() => setPage(1), [q, tab, tag, sort, setPage])

  return (
    <>
      <PageHeader
        title="Attendees"
        subtitle="Everyone who has registered for your events."
        actions={
          <>
            <Button variant="ghost">
              <Icon name="hgi-download-01" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="primary" onClick={invite.onOpen}>
              <Icon name="hgi-mail-send-01" />
              <span className="hidden sm:inline">Invite</span>
              <span className="sm:hidden">Invite</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* pill tabs (out of table) */}
      <PillTabs items={tabs} value={tab} onChange={setTab} />

      {/* search + filters (out of table) */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search by name or email…"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <i className="hgi-stroke hgi-tag-01 text-[15px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select
              value={tag || 'All tags'}
              onChange={(e) => setTag(e.target.value === 'All tags' ? '' : e.target.value)}
              className="select h-10 w-full border-0 bg-surface pl-9 font-medium sm:w-44"
            >
              {ATT_TAGS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 sm:flex-none">
            <i className="hgi-stroke hgi-arrow-up-down text-[15px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as AttendeeSort)}
              className="select h-10 w-full border-0 bg-surface pl-9 font-medium sm:w-52"
            >
              <option value="activity">{SORT_LABEL.activity}</option>
              <option value="name">{SORT_LABEL.name}</option>
              <option value="events">{SORT_LABEL.events}</option>
              <option value="tickets">{SORT_LABEL.tickets}</option>
            </select>
          </div>
        </div>
      </div>

      {/* table */}
      <Card className="mt-3 p-4">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[860px]">
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Phone</th>
                <th>Events</th>
                <th>Tickets</th>
                <th>Tags</th>
                <th>Last activity</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.length ? (
                pager.slice.map((a, i) => {
                  const badge = a.tag ? TAG_BADGE[a.tag] : null
                  return (
                    <tr key={a.email + i}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="avatar h-8 w-8 text-[11px]">{a.initials}</span>
                          <div className="min-w-0 leading-tight">
                            <p className="truncate font-medium text-ink">{a.name}</p>
                            <p className="truncate text-[11px] text-muted">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted tnum">{a.phone}</td>
                      <td className="text-muted tnum">
                        {a.events} event{a.events === 1 ? '' : 's'}
                      </td>
                      <td className="font-semibold text-ink tnum">{a.tickets}</td>
                      {badge ? (
                        <td>
                          <span className={cn('badge', badge.cls)}>
                            <i className={cn('hgi-stroke', badge.icon, 'text-[12px]')} />
                            {badge.label}
                          </span>
                        </td>
                      ) : (
                        <td className="text-muted">—</td>
                      )}
                      <td className="text-muted tnum">{a.date}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="btn-icon"
                            title="View profile"
                            onClick={profile.onOpen}
                          >
                            <i className="hgi-stroke hgi-eye text-[16px]" />
                          </button>
                          <button className="btn-icon" title="More">
                            <i className="hgi-stroke hgi-more-vertical text-[16px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="py-10 text-center text-[13px] text-muted">No matches.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Paginator
          from={pager.from}
          to={pager.to}
          total={pager.total}
          page={pager.page}
          pageCount={pager.pageCount}
          size={pager.size}
          onPage={pager.setPage}
          onSize={pager.setSize}
          noun="attendees"
        />
      </Card>

      <PageFooter />

      {/* Attendee profile panel */}
      <Panel
        open={profile.open}
        onClose={profile.onClose}
        title="Attendee profile"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={profile.onClose}>
              <Icon name="hgi-mail-01" />
              Send email
            </Button>
            <Button variant="primary" className="flex-1" onClick={profile.onClose}>
              <Icon name="hgi-edit-02" />
              Edit
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="avatar h-14 w-14 text-[18px]">AP</span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-ink">Anong Praditsarn</p>
              <p className="truncate text-[12px] text-muted">anong.p@gmail.com</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="badge badge-purple">
                  <i className="hgi-stroke hgi-star text-[12px]" />
                  VIP
                </span>
              </div>
            </div>
          </div>

          <div className="card space-y-2 p-3">
            <div className="flex items-center gap-2 text-[13px]">
              <i className="hgi-stroke hgi-mail-01 text-[15px] text-muted" />
              <span className="text-ink">anong.p@gmail.com</span>
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <i className="hgi-stroke hgi-call text-[15px] text-muted" />
              <span className="text-ink tnum">+66 81 234 5678</span>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Registered events
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-hair p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">Tech Summit 2026</p>
                  <p className="text-[11px] text-muted">Jul 18, 2026 · BITEC</p>
                </div>
                <span className="badge badge-green">
                  <i className="hgi-stroke hgi-checkmark-badge-01 text-[12px]" />
                  Checked-in
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-hair p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">Bangkok Jazz Night</p>
                  <p className="text-[11px] text-muted">Jul 12, 2026 · Sala Daeng</p>
                </div>
                <span className="badge badge-blue">
                  <i className="hgi-stroke hgi-ticket-01 text-[12px]" />
                  Registered
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-hair p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">
                    Thai Street Food Festival
                  </p>
                  <p className="text-[11px] text-muted">Jun 21, 2026 · Lumphini Park</p>
                </div>
                <span className="badge badge-green">
                  <i className="hgi-stroke hgi-checkmark-badge-01 text-[12px]" />
                  Checked-in
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-hair p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">UX Bangkok Meetup</p>
                  <p className="text-[11px] text-muted">May 14, 2026 · IconSiam</p>
                </div>
                <span className="badge badge-gray">Past</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Tickets
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-hair p-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <i className="hgi-stroke hgi-ticket-star text-[15px] text-muted" />
                  <p className="truncate text-[13px] text-ink">VIP Pass · Tech Summit 2026</p>
                </div>
                <span className="text-[13px] font-semibold text-ink tnum">฿1,250</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-hair p-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <i className="hgi-stroke hgi-ticket-01 text-[15px] text-muted" />
                  <p className="truncate text-[13px] text-ink">
                    General Admission · Bangkok Jazz Night
                  </p>
                </div>
                <span className="text-[13px] font-semibold text-ink tnum">฿480</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-hair p-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <i className="hgi-stroke hgi-ticket-01 text-[15px] text-muted" />
                  <p className="truncate text-[13px] text-ink">Early Bird · UX Bangkok Meetup</p>
                </div>
                <span className="badge badge-green">Free</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Activity
            </h4>
            <div className="space-y-4 border-l border-line pl-4">
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-brand-soft" />
                <p className="text-[13px] font-medium text-ink">Checked in at Tech Summit 2026</p>
                <p className="text-[11px] text-muted tnum">Jul 15, 2026 · 10:24</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-line" />
                <p className="text-[13px] font-medium text-ink">Registered for Bangkok Jazz Night</p>
                <p className="text-[11px] text-muted tnum">Jul 9, 2026 · 14:52</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-line" />
                <p className="text-[13px] font-medium text-ink">Updated contact details</p>
                <p className="text-[11px] text-muted tnum">Jun 28, 2026</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-line" />
                <p className="text-[13px] font-medium text-ink">Joined Eventa</p>
                <p className="text-[11px] text-muted tnum">Mar 3, 2026</p>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Invite panel */}
      <Panel
        open={invite.open}
        onClose={invite.onClose}
        title="Invite attendee"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={invite.onClose}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={invite.onClose}>
              <Icon name="hgi-mail-send-01" />
              Send invite
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Full name</Label>
            <Input type="text" placeholder="e.g. Somchai Tanakit" />
          </div>
          <div>
            <Label>Email address</Label>
            <Input type="email" placeholder="name@example.com" />
          </div>
          <div>
            <Label>Event</Label>
            <Select defaultValue={ATT_EVENTS[0]}>
              {ATT_EVENTS.map((ev) => (
                <option key={ev}>{ev}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Personal message</Label>
            <Textarea placeholder="Add a short note to the invite email..." />
            <Hint>Optional — shown at the top of the invite email.</Hint>
          </div>
        </div>
      </Panel>
    </>
  )
}
