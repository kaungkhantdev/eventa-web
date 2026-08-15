import { useEffect, useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  Button,
  HeaderUser,
  Icon,
  PageFooter,
  PageHeader,
  Paginator,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import type { ActionResult } from '@/app/loaders'
import { ConfirmDeleteModal } from '@/features/ticketing/components/ConfirmDeleteModal'
import { EventChooser } from '../components/EventChooser'
import { SpeakerPanel } from '../components/SpeakerPanel'
import type { SpeakersData } from '../program.routes'
import type { SpeakerCard } from '../program.types'

/**
 * The speaker directory (US-PROG-04..07). Layout ported from speakers.html.
 *
 * Speakers belong to an event on the API, so the page works one event at a
 * time — the picker chooses which, and the URL remembers it.
 */

type ViewMode = 'grid' | 'list'

const MAX_SEARCH_LENGTH = 120

export default function SpeakersPage() {
  const data = useLoaderData() as SpeakersData
  const { params, set } = useFilters()
  const filtering = useIsFiltering()
  const panel = useDisclosure()
  const del = useDisclosure()
  const [view, setView] = useState<ViewMode>('grid')
  const [editing, setEditing] = useState<SpeakerCard | null>(null)
  const [deleting, setDeleting] = useState<SpeakerCard | null>(null)
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))

  const add = () => {
    setEditing(null)
    panel.onOpen()
  }

  return (
    <>
      <PageHeader
        title="Speakers"
        subtitle="Manage speakers and their sessions."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={add} disabled={!data.event}>
              <Icon name="hgi-user-add-01" size={16} />
              <span className="hidden sm:inline">Add speaker</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <Icon
            name="hgi-search-01"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search speakers by name, company or topic…"
            maxLength={MAX_SEARCH_LENGTH}
            aria-label="Search speakers"
          />
        </div>
        <EventChooser
          events={data.events}
          value={data.event?.id ?? ''}
          onChange={(eventId) => set({ eventId })}
        />
        <div className="flex shrink-0 items-center gap-1 self-start rounded-lg bg-surface p-1 sm:self-auto">
          <ViewButton icon="hgi-grid-view" label="Grid view" on={view === 'grid'} onClick={() => setView('grid')} />
          <ViewButton icon="hgi-list-view" label="List view" on={view === 'list'} onClick={() => setView('list')} />
        </div>
      </div>

      <div className={cn(filtering && 'opacity-60 transition-opacity')}>
        <p className="mb-2 mt-3 text-[12px] text-muted">
          {data.window.total} {data.window.total === 1 ? 'speaker' : 'speakers'}
        </p>

        {data.cards.length === 0 ? (
          <EmptyState hasEvent={Boolean(data.event)} />
        ) : (
          <div
            className={cn(
              view === 'grid'
                ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'
                : 'flex flex-col gap-2',
            )}
          >
            {data.cards.map((card) => (
              <SpeakerTile
                key={card.id}
                card={card}
                list={view === 'list'}
                onEdit={() => {
                  setEditing(card)
                  panel.onOpen()
                }}
                onDelete={() => {
                  setDeleting(card)
                  del.onOpen()
                }}
              />
            ))}
          </div>
        )}

        <Paginator
          {...data.window}
          noun="speakers"
          onPage={(page) => set({ page })}
          onSize={(size) => set({ limit: size, page: null })}
        />
      </div>

      <PageFooter />

      <SpeakerPanel
        open={panel.open}
        onClose={panel.onClose}
        editing={editing}
        eventId={data.event?.id ?? ''}
        eventName={data.event?.name ?? ''}
      />

      <DeleteSpeakerModal
        open={del.open}
        onClose={del.onClose}
        target={deleting}
        eventId={data.event?.id ?? ''}
      />
    </>
  )
}

function ViewButton({
  icon,
  label,
  on,
  onClick,
}: {
  icon: string
  label: string
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={on}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-md transition hover:text-ink',
        on ? 'bg-brand-soft text-brand' : 'text-muted',
      )}
    >
      <Icon name={icon} size={16} />
    </button>
  )
}

function EmptyState({ hasEvent }: { hasEvent: boolean }) {
  return (
    <div className="card mt-2 flex flex-col items-center justify-center p-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-line text-muted">
        <Icon name="hgi-mic-01" size={22} />
      </span>
      <p className="mt-3 text-[14px] font-semibold text-ink">
        {hasEvent ? 'No speakers found' : 'No events yet'}
      </p>
      <p className="mt-1 text-[12px] text-muted">
        {hasEvent
          ? 'Try a different search, or add the first speaker.'
          : 'Create an event before booking speakers for it.'}
      </p>
    </div>
  )
}

interface SpeakerTileProps {
  card: SpeakerCard
  list: boolean
  onEdit: () => void
  onDelete: () => void
}

function SpeakerTile({ card, list, onEdit, onDelete }: SpeakerTileProps) {
  return (
    <div className={cn('card p-4', list && 'flex items-center gap-4')}>
      <div className={cn('flex items-start gap-3', list && 'min-w-0 flex-1 items-center')}>
        <span
          className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-full text-[15px] font-semibold',
            card.avatar,
          )}
        >
          {card.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-ink">{card.name}</p>
          <p className="truncate text-[12px] text-muted">{card.role}</p>
        </div>
        {!list && (
          <button type="button" className="btn-icon -mr-1 -mt-1 shrink-0" title="Edit speaker" onClick={onEdit}>
            <Icon name="hgi-more-horizontal" size={16} />
          </button>
        )}
      </div>

      <div className={cn(!list && 'mt-3 space-y-0.5 border-t border-line pt-3', list && 'hidden sm:block')}>
        <div className="flex items-center gap-2.5 py-1 text-[12.5px]">
          <Icon name="hgi-mail-01" size={15} className="shrink-0 text-muted" />
          <span className="truncate text-ink">{card.email}</span>
        </div>
        <div className="flex items-center gap-2.5 py-1 text-[12.5px]">
          <Icon name="hgi-call-02" size={15} className="shrink-0 text-muted" />
          <span className="tnum text-ink">{card.phone}</span>
        </div>
      </div>

      <div className={cn('flex items-center gap-3', !list && 'mt-3 border-t border-line pt-3')}>
        <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
          <Icon name="hgi-mic-01" size={15} />
          <span className="tnum">{card.sessionCount}</span>
          {card.sessionCount === 1 ? 'session' : 'sessions'}
        </span>
        <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
          <Icon name="hgi-star" size={15} />
          <span className="tnum">{card.rating}</span>
        </span>
        <div className="ml-auto flex items-center gap-1">
          {list && (
            <button type="button" className="btn-icon" title="Edit speaker" onClick={onEdit}>
              <Icon name="hgi-edit-02" size={16} />
            </button>
          )}
          <button type="button" className="btn-icon" title="Remove speaker" onClick={onDelete}>
            <Icon name="hgi-delete-02" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Removing a speaker.
 *
 * The API refuses while they are still booked into sessions and says so — that
 * sentence replaces the warning, because the fix is to unbook them first.
 */
function DeleteSpeakerModal({
  open,
  onClose,
  target,
  eventId,
}: {
  open: boolean
  onClose: () => void
  target: SpeakerCard | null
  eventId: string
}) {
  const fetcher = useFetcher<ActionResult>()
  const refused = fetcher.data?.ok === false ? fetcher.data.error : null
  const done = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (done && open) onClose()
  }, [done, open, onClose])

  return (
    <ConfirmDeleteModal
      open={open}
      onClose={onClose}
      title="Remove speaker?"
      message={refused ?? `This removes ${target?.name ?? 'the speaker'} from the event.`}
      tone={refused ? 'error' : 'default'}
      confirmLabel={fetcher.state === 'idle' ? 'Remove' : 'Removing…'}
      onConfirm={() =>
        target &&
        fetcher.submit({ intent: 'delete', eventId, speakerId: target.id }, { method: 'post' })
      }
    />
  )
}
