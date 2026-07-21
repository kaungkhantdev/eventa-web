import { useEffect, useMemo, useState } from 'react'
import { Button, HeaderUser, Icon, PageFooter, PageHeader, usePagination } from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { num } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  SPEAKERS,
  SPEAKER_EVENT_FILTERS,
  SPEAKER_PANEL_EVENTS,
  type Speaker,
  type SpeakerTone,
} from '../data/speakers'

const TONE: Record<SpeakerTone, string> = {
  green: 'bg-brand-soft text-brand',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300',
}

type ViewMode = 'grid' | 'list'

function SpeakerGridCard({ s, onEdit }: { s: Speaker; onEdit: () => void }) {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-full text-[15px] font-semibold',
            TONE[s.tone],
          )}
        >
          {s.ini}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-ink">{s.name}</p>
          <p className="truncate text-[12px] text-muted">{s.role}</p>
        </div>
        <button
          type="button"
          className="btn-icon -mr-1 -mt-1 shrink-0"
          title="Edit speaker"
          onClick={onEdit}
        >
          <Icon name="hgi-more-horizontal" size={16} />
        </button>
      </div>
      <div className="mt-3 space-y-0.5 border-t border-line pt-3">
        <div className="flex items-center gap-2.5 py-1 text-[12.5px]">
          <Icon name="hgi-mail-01" size={15} className="shrink-0 text-muted" />
          <span className="truncate text-ink">{s.email}</span>
        </div>
        <div className="flex items-center gap-2.5 py-1 text-[12.5px]">
          <Icon name="hgi-call-02" size={15} className="shrink-0 text-muted" />
          <span className="text-ink tnum">{s.phone}</span>
        </div>
        <a
          href="#"
          className="group -mx-1.5 flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[12.5px] transition hover:bg-brand-soft/50"
        >
          <Icon name="hgi-mic-01" size={15} className="shrink-0 text-muted group-hover:text-brand" />
          <span className="font-medium text-ink group-hover:text-brand">Sessions</span>
          <span className="ml-auto flex items-center gap-1.5 text-muted">
            <span className="tnum">{s.sessions}</span>
            <Icon
              name="hgi-arrow-right-01"
              size={15}
              className="transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
            />
          </span>
        </a>
        <a
          href="#"
          className="group -mx-1.5 flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[12.5px] transition hover:bg-brand-soft/50"
        >
          <Icon name="hgi-star" size={15} className="shrink-0 text-muted group-hover:text-brand" />
          <span className="font-medium text-ink group-hover:text-brand">Reviews</span>
          <span className="ml-auto flex items-center gap-1.5 text-muted">
            <span className="tnum">{s.rating}</span>
            <Icon
              name="hgi-arrow-right-01"
              size={15}
              className="transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
            />
          </span>
        </a>
      </div>
    </div>
  )
}

function SpeakerListCard({
  s,
  onEdit,
  onDelete,
}: {
  s: Speaker
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="card flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3 sm:w-60 sm:shrink-0">
        <span
          className={cn(
            'grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-semibold',
            TONE[s.tone],
          )}
        >
          {s.ini}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-ink">{s.name}</p>
          <p className="truncate text-[12px] text-muted">{s.role}</p>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4 sm:items-center">
        <div className="flex min-w-0 items-center gap-2 text-[12.5px] text-ink">
          <Icon name="hgi-mail-01" size={14} className="shrink-0 text-muted" />
          <span className="truncate">{s.email}</span>
        </div>
        <div className="flex items-center gap-2 text-[12.5px] text-ink">
          <Icon name="hgi-call-02" size={14} className="shrink-0 text-muted" />
          <span className="tnum">{s.phone}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12.5px] text-muted">
          <Icon name="hgi-mic-01" size={14} className="shrink-0 text-muted" />
          <span className="font-semibold text-ink tnum">{s.sessions}</span> sessions
        </div>
        <div className="flex items-center gap-1.5 text-[12.5px] text-muted">
          <Icon name="hgi-star" size={14} className="shrink-0 text-amber-500" />
          <span className="font-semibold text-ink tnum">{s.rating}</span> rating
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:pl-2">
        <button type="button" className="btn btn-soft btn-sm" onClick={onEdit}>
          Edit
        </button>
        <button type="button" className="btn-icon text-red-500" title="Delete" onClick={onDelete}>
          <Icon name="hgi-delete-02" size={15} />
        </button>
      </div>
    </div>
  )
}

export default function SpeakersPage() {
  const [query, setQuery] = useState('')
  const [event, setEvent] = useState<string>('All events')
  const [view, setView] = useState<ViewMode>('grid')

  const panel = useDisclosure()
  const del = useDisclosure()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        panel.onClose()
        del.onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [panel.onClose, del.onClose])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SPEAKERS.filter((s) => {
      const mq = !q || (s.name + ' ' + s.role + ' ' + s.email).toLowerCase().indexOf(q) !== -1
      const me = event === 'All events' || s.event === event
      return mq && me
    })
  }, [query, event])

  const pg = usePagination(filtered, 10)

  return (
    <>
      <PageHeader
        title="Speakers"
        subtitle="Manage speakers and their sessions."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={panel.onOpen}>
              <Icon name="hgi-user-add-01" size={16} />
              <span className="hidden sm:inline">Add speaker</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* toolbar (flat, on canvas) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <Icon
            name="hgi-search-01"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              pg.reset()
            }}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search speakers by name, company or topic…"
          />
        </div>
        <div className="relative w-full sm:w-56">
          <Icon
            name="hgi-calendar-03"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand"
          />
          <select
            value={event}
            onChange={(e) => {
              setEvent(e.target.value)
              pg.reset()
            }}
            className="select h-10 w-full border-0 bg-surface pl-9 text-[14px] font-semibold"
          >
            {SPEAKER_EVENT_FILTERS.map((ev) => (
              <option key={ev}>{ev}</option>
            ))}
          </select>
        </div>
        <div className="flex shrink-0 items-center gap-1 self-start rounded-lg bg-surface p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={cn(
              'grid h-8 w-8 place-items-center rounded-md transition hover:text-ink',
              view === 'grid' ? 'bg-brand-soft text-brand' : 'text-muted',
            )}
            title="Grid view"
          >
            <Icon name="hgi-grid-view" size={16} />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={cn(
              'grid h-8 w-8 place-items-center rounded-md transition hover:text-ink',
              view === 'list' ? 'bg-brand-soft text-brand' : 'text-muted',
            )}
            title="List view"
          >
            <Icon name="hgi-list-view" size={16} />
          </button>
        </div>
      </div>

      {/* result count */}
      <p className="mb-2 mt-3 text-[12px] text-muted">
        {filtered.length + (filtered.length === 1 ? ' speaker' : ' speakers')}
      </p>

      {/* speakers (grid / list) */}
      {filtered.length === 0 ? (
        <div className="mt-2 card flex flex-col items-center justify-center p-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-line text-muted">
            <Icon name="hgi-mic-01" size={22} />
          </span>
          <p className="mt-3 text-[14px] font-semibold text-ink">No speakers found</p>
          <p className="mt-1 text-[12px] text-muted">Try a different search or event filter.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pg.slice.map((s) => (
            <SpeakerGridCard key={s.email} s={s} onEdit={panel.onOpen} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pg.slice.map((s) => (
            <SpeakerListCard key={s.email} s={s} onEdit={panel.onOpen} onDelete={del.onOpen} />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
        <p>
          {filtered.length === 0 ? (
            'No speakers'
          ) : (
            <>
              Showing{' '}
              <span className="font-semibold text-ink">
                {pg.from}–{pg.to}
              </span>{' '}
              of <span className="font-semibold text-ink tnum">{num(filtered.length)}</span> speakers
            </>
          )}
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 whitespace-nowrap">
            Rows per page
            <select
              value={pg.size}
              onChange={(e) => pg.setSize(Number(e.target.value))}
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
              type="button"
              className="btn btn-soft btn-sm"
              aria-label="Previous page"
              disabled={filtered.length === 0 || pg.page <= 1}
              onClick={() => pg.setPage(pg.page - 1)}
            >
              <Icon name="hgi-arrow-left-01" size={14} />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              aria-label="Next page"
              disabled={filtered.length === 0 || pg.page >= pg.pageCount}
              onClick={() => pg.setPage(pg.page + 1)}
            >
              <span className="hidden sm:inline">Next</span>
              <Icon name="hgi-arrow-right-01" size={14} />
            </button>
          </div>
        </div>
      </div>

      <PageFooter />

      {/* Add / edit speaker panel */}
      <div className={cn('panel-overlay', panel.open && 'open')} onClick={panel.onClose} />
      <aside className={cn('panel', panel.open && 'open')} role="dialog" aria-modal="true">
        <header className="flex items-center justify-between border-b border-hair p-4">
          <h3 className="text-[15px] font-bold tracking-tight">Add speaker</h3>
          <button type="button" className="btn-icon" onClick={panel.onClose}>
            <Icon name="hgi-cancel-01" size={18} />
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex items-center gap-4">
            <span className="avatar h-16 w-16 shrink-0 text-[18px]">
              <Icon name="hgi-camera-01" size={22} />
            </span>
            <div>
              <button type="button" className="btn btn-soft btn-sm">
                <Icon name="hgi-image-upload-01" size={15} />
                Upload photo
              </button>
              <p className="hint">JPG or PNG, at least 200×200px.</p>
            </div>
          </div>

          <div>
            <label className="label">Full name</label>
            <input type="text" className="input" placeholder="e.g. Anong Prasert" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Job title</label>
              <input type="text" className="input" placeholder="e.g. CTO" />
            </div>
            <div>
              <label className="label">Company</label>
              <input type="text" className="input" placeholder="e.g. Nimble Works" />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="name@company.com" />
          </div>

          <div>
            <label className="label">Phone</label>
            <input type="tel" className="input" placeholder="(302) 555-0107" />
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea className="textarea" placeholder="Short speaker bio for the event page…" />
          </div>

          <div>
            <label className="label">Session / topic</label>
            <input type="text" className="input" placeholder="e.g. Scaling APIs for 10M Users" />
          </div>

          <div>
            <label className="label">Event</label>
            <select className="select">
              {SPEAKER_PANEL_EVENTS.map((ev) => (
                <option key={ev}>{ev}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Social links</label>
            <div className="space-y-2">
              <div className="relative">
                <Icon
                  name="hgi-global"
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input type="text" className="input pl-9" placeholder="Website URL" />
              </div>
              <div className="relative">
                <Icon
                  name="hgi-link-square-02"
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input type="text" className="input pl-9" placeholder="Twitter / X handle" />
              </div>
              <div className="relative">
                <Icon
                  name="hgi-link-01"
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input type="text" className="input pl-9" placeholder="LinkedIn URL" />
              </div>
            </div>
          </div>
        </div>
        <footer className="flex gap-2 border-t border-hair p-4">
          <button type="button" className="btn btn-soft flex-1" onClick={panel.onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary flex-1" onClick={panel.onClose}>
            Save speaker
          </button>
        </footer>
      </aside>

      {/* Delete confirm modal */}
      <div className={cn('panel-overlay', del.open && 'open')} onClick={del.onClose} />
      <div className={cn('modal', del.open && 'open')} role="dialog" aria-modal="true">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300">
              <Icon name="hgi-delete-02" size={18} />
            </span>
            <div>
              <h3 className="text-[15px] font-bold tracking-tight">Remove speaker?</h3>
              <p className="mt-1 text-[13px] text-muted">
                This will remove the speaker from all sessions they're assigned to. This action
                can't be undone.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-soft flex-1" onClick={del.onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger flex-1" onClick={del.onClose}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
