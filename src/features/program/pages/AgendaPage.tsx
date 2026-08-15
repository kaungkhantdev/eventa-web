import { useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import { Button, HeaderUser, Icon, PageFooter, PageHeader } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters } from '@/lib/useFilters'
import { EventChooser } from '../components/EventChooser'
import { SessionPanel } from '../components/SessionPanel'
import { HOUR_HEIGHT, calendarHours } from '../program.mapper'
import type { AgendaData } from '../program.routes'
import type { ActionResult } from '@/app/loaders'
import type { AgendaBlock, AgendaDay, SessionColor, SessionDraft } from '../program.types'

/**
 * The event schedule (US-PROG-01..03). Layout ported from agenda.html.
 *
 * The kit drew a fixed seven-day week. A real event runs for as long as it runs,
 * so the strip has one column per day between its start and end — which is also
 * what the API's 1-based `day` index counts against.
 */

const PALETTE: Record<SessionColor, { bg: string; text: string }> = {
  green: { bg: 'bg-brand-soft', text: 'text-brand-dark dark:text-brand' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-400/15', text: 'text-amber-700 dark:text-amber-300' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-300' },
  slate: { bg: 'bg-line', text: 'text-muted' },
}

export default function AgendaPage() {
  const data = useLoaderData() as AgendaData
  const { set } = useFilters()
  const panel = useDisclosure()
  const hours = calendarHours()
  const [editing, setEditing] = useState<SessionDraft | null>(null)
  const remove = useFetcher<ActionResult>()

  const open = (session: SessionDraft | null) => {
    setEditing(session)
    panel.onOpen()
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle="Plan sessions across the days your event runs."
        actions={
          <>
            <Button
              variant="primary"
              className="shrink-0"
              onClick={() => open(null)}
              disabled={!data.event}
            >
              <Icon name="hgi-add-01" size={16} />
              <span className="hidden sm:inline">New session</span>
              <span className="sm:hidden">New</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <EventChooser
          events={data.events}
          value={data.event?.id ?? ''}
          onChange={(eventId) => set({ eventId })}
        />
      </div>

      <div className="card overflow-hidden p-0">
        {data.event && data.days.length > 0 ? (
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${56 + data.days.length * 140}px` }}>
              <DayHeader days={data.days} />
              <div
                className="grid"
                style={{ gridTemplateColumns: `56px repeat(${data.days.length}, minmax(0, 1fr))` }}
              >
                <div className="relative border-r border-hair">
                  {hours.map((hour) => (
                    <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
                      <span className="tnum absolute right-2 top-1 text-[10px] text-muted">
                        {String(hour).padStart(2, '0')}:00
                      </span>
                    </div>
                  ))}
                </div>
                {data.days.map((day) => (
                  <DayColumn
                    key={day.index}
                    hours={hours.length}
                    blocks={data.blocks.filter((block) => block.day === day.index)}
                    onOpen={open}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyAgenda hasEvent={Boolean(data.event)} name={data.event?.name ?? ''} />
        )}
      </div>

      <PageFooter />

      <SessionPanel
        open={panel.open}
        onClose={panel.onClose}
        eventId={data.event?.id ?? ''}
        days={data.days}
        speakers={data.speakers}
        editing={editing}
        onDelete={() => {
          if (!editing) return
          remove.submit(
            { intent: 'delete', eventId: data.event?.id ?? '', sessionId: editing.id },
            { method: 'post' },
          )
          panel.onClose()
        }}
      />

      {remove.data?.ok === false && (
        <p role="alert" className="mt-3 text-[13px] text-red-500">
          {remove.data.error}
        </p>
      )}
    </>
  )
}

function DayHeader({ days }: { days: AgendaDay[] }) {
  return (
    <div
      className="grid border-b border-hair"
      style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
    >
      <div className="grid place-items-center border-r border-hair py-3 text-muted">
        <Icon name="hgi-calendar-03" size={16} />
      </div>
      {days.map((day) => (
        <div key={day.index} className="border-r border-hair py-2.5 text-center last:border-r-0">
          <p className={cn('text-[13px] font-bold', day.isFirst ? 'text-brand' : 'text-ink')}>
            {day.weekday}
          </p>
          <p className={cn('tnum text-[11px]', day.isFirst ? 'text-brand/70' : 'text-muted')}>
            {day.dayOfMonth}
          </p>
        </div>
      ))}
    </div>
  )
}

function DayColumn({
  hours,
  blocks,
  onOpen,
}: {
  hours: number
  blocks: AgendaBlock[]
  onOpen: (session: SessionDraft) => void
}) {
  return (
    <div className="relative border-r border-hair last:border-r-0">
      {Array.from({ length: hours }, (_, i) => (
        <div key={i} style={{ height: HOUR_HEIGHT }} className="border-b border-line/70" />
      ))}
      {blocks.map((block) => {
        const palette = PALETTE[block.color] ?? PALETTE.green
        return (
          <button
            key={block.id}
            type="button"
            onClick={() => onOpen(block.edit)}
            title={`Edit ${block.title}`}
            className={cn(
              'absolute inset-x-1 overflow-hidden rounded-lg px-2 pt-1.5 text-left transition hover:brightness-[0.97]',
              palette.bg,
            )}
            style={{ top: block.top + 2, height: Math.max(block.height - 4, 18) }}
          >
            <p className={cn('tnum text-[10px] font-medium', palette.text)}>{block.time}</p>
            <p className={cn('truncate text-[12px] font-bold', palette.text)}>{block.title}</p>
            <p className="truncate text-[10px] text-muted">{block.who}</p>
          </button>
        )
      })}
    </div>
  )
}

function EmptyAgenda({ hasEvent, name }: { hasEvent: boolean; name: string }) {
  return (
    <div className="grid place-items-center px-4 py-16 text-center">
      <div className="max-w-sm">
        <Icon name="hgi-calendar-03" size={30} className="text-muted/40" />
        <p className="mt-2 text-[14px] font-semibold text-ink">
          {hasEvent ? `No agenda for ${name} yet` : 'No events yet'}
        </p>
        <p className="mt-1 text-[13px] text-muted">
          {hasEvent
            ? 'Add a session to start building this event’s schedule.'
            : 'Create an event before planning its programme.'}
        </p>
      </div>
    </div>
  )
}
