import { useEffect } from 'react'
import { Icon, Segmented, Skeleton } from '@/components/ui'
import type { Panel } from '@/app/panels'
import { cn } from '@/lib/cn'
import type { TicketModalState } from '../lib/useTicketModal'
import { ticketChoices } from '../myEvents.mapper'
import type { TicketPass } from '../myEvents.types'

/* QR ticket modal from my-events.html: one ticket's scannable QR, its
   reference, a preview of the printable pass, and its download (US-DISC-07).
   Uses the same .modal / .panel-overlay CSS the barrel Panel/Modal rely on.

   Everything shown is one TICKET's, fetched from the API when it is opened —
   never derived from the order card. An order of several tickets gets a
   switcher, because each admits one person with a QR of its own. */

export function TicketModal({ state }: { state: TicketModalState }) {
  const { open, onClose, event, ticketId, show, pass } = state

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const choices = ticketChoices(event?.ticketIds ?? [])
  const ready = pass?.ok ? pass.data : null

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <div className={cn('modal', open && 'open')} role="dialog" aria-modal="true">
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold tracking-tight">Your ticket QR</h3>
              <p className="truncate text-[12px] font-semibold text-brand">{event?.title || '—'}</p>
            </div>
            <button type="button" className="btn-icon shrink-0" onClick={onClose} aria-label="Close">
              <Icon name="hgi-cancel-01" size={18} />
            </button>
          </div>
          {choices.length > 0 && ticketId && (
            <Segmented items={choices} value={ticketId} onChange={show} className="mt-3" />
          )}
          <TicketBody ticketId={ticketId} pass={pass} />
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-soft flex-1" onClick={onClose}>
              Close
            </button>
            {ready?.printable && (
              <a href={ready.printable} download={ready.filename} className="btn btn-primary flex-1">
                <Icon name="hgi-download-04" size={15} />
                Download ticket
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/** Loading, refused, or the ticket itself. */
function TicketBody({
  ticketId,
  pass,
}: {
  ticketId: string | null
  pass: Panel<TicketPass> | null
}) {
  if (!ticketId) {
    return <p className="mt-4 text-[13px] text-muted">This registration has no tickets to show.</p>
  }
  if (!pass) {
    return (
      <div className="mt-4 grid place-items-center">
        <Skeleton className="h-44 w-44 rounded-xl" />
      </div>
    )
  }
  if (!pass.ok) {
    return (
      <p role="alert" className="mt-4 text-[13px] text-red-500">
        {pass.error}
      </p>
    )
  }
  return <TicketDetails pass={pass.data} />
}

/** Why there is no QR: a void ticket admits nobody, so none is drawn for it. */
const NO_LONGER_VALID = 'This ticket is no longer valid and will not admit anyone.'
const UNDRAWABLE = 'This code could not be drawn.'

function TicketDetails({ pass }: { pass: TicketPass }) {
  const noCode = pass.valid ? UNDRAWABLE : NO_LONGER_VALID
  return (
    <>
      {pass.qr ? (
        <>
          <p className="mt-1 text-[12px] text-muted">Show this code at check-in.</p>
          <div className="mt-4 grid place-items-center">
            <div className="grid place-items-center rounded-xl bg-white p-3 ring-1 ring-hair">
              <img src={pass.qr} alt={`QR code for ticket ${pass.reference}`} className="h-44 w-44" />
            </div>
          </div>
        </>
      ) : (
        <p className="mt-4 rounded-lg bg-line px-3 py-2 text-[13px] font-semibold text-muted">
          {noCode}
        </p>
      )}
      <div className="mt-4 rounded-lg border border-hair bg-canvas px-3 py-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          Ticket reference
        </p>
        <p className="mt-0.5 font-mono text-[13px] font-semibold text-ink">{pass.reference}</p>
        <p className="text-[11px] text-muted">Admission {pass.admission}</p>
      </div>
      {pass.printable ? (
        <div className="mt-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Ticket preview
          </p>
          <img
            src={pass.printable}
            alt="Downloadable ticket preview"
            className="mx-auto block max-h-72 rounded-xl border border-hair"
          />
        </div>
      ) : (
        <p className="mt-4 text-[12px] text-muted">{pass.printRefusal}</p>
      )}
    </>
  )
}
