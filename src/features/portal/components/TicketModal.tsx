import { useEffect, useRef } from 'react'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import { buildFlyer, drawQR, makeQR, type FlyerTicket } from '../lib/ticketFlyer'

/* QR ticket modal from my-events.html: a scannable QR (drawn onto a canvas),
   the ticket id, a live preview of the downloadable flyer, and a PNG download.
   Uses the same .modal / .panel-overlay CSS the barrel Panel/Modal rely on. */

/** The flyer title uses "Titan One" (loaded by the static kit). Inject it once
 *  at runtime so we don't touch the shared index.html. */
function useTitanOne() {
  useEffect(() => {
    if (document.getElementById('titan-one-font')) return
    const link = document.createElement('link')
    link.id = 'titan-one-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Titan+One&display=swap'
    document.head.appendChild(link)
  }, [])
}

/** Wait for the flyer's display fonts before painting, then run `cb`. */
function withFonts(cb: () => void) {
  const fonts = ['400 40px "Titan One"', '800 40px Inter']
  const anyDoc = document as Document & { fonts?: FontFaceSet }
  if (anyDoc.fonts) {
    Promise.all(fonts.map((f) => anyDoc.fonts!.load(f)))
      .then(cb)
      .catch(cb)
  } else cb()
}

export function TicketModal({
  open,
  onClose,
  ticket,
}: {
  open: boolean
  onClose: () => void
  ticket: FlyerTicket | null
}) {
  useTitanOne()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open || !ticket) return
    // plain QR onto the modal canvas
    const cv = canvasRef.current
    if (cv) {
      const ctx = cv.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, cv.width, cv.height)
        drawQR(ctx, makeQR(ticket.payload), 0, 0, cv.width)
      }
    }
    // live preview of the downloadable flyer (waits for the display font)
    withFonts(() => {
      const img = imgRef.current
      if (!img) return
      try {
        img.src = buildFlyer(ticket).toDataURL('image/png')
      } catch {
        /* canvas tainted / font unavailable — leave the preview blank */
      }
    })
  }, [open, ticket])

  function download() {
    if (!ticket) return
    withFonts(() => {
      const a = document.createElement('a')
      a.href = buildFlyer(ticket).toDataURL('image/png')
      a.download = 'eventa-ticket-' + ticket.id + '.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
    })
  }

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <div className={cn('modal', open && 'open')} role="dialog" aria-modal="true">
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold tracking-tight">Your ticket QR</h3>
              <p className="truncate text-[12px] font-semibold text-brand">{ticket?.event || '—'}</p>
            </div>
            <button type="button" className="btn-icon shrink-0" onClick={onClose} aria-label="Close">
              <Icon name="hgi-cancel-01" size={18} />
            </button>
          </div>
          <p className="mt-1 text-[12px] text-muted">Show this code at check-in.</p>
          <div className="mt-4 grid place-items-center">
            <div className="grid place-items-center rounded-xl bg-white p-3 ring-1 ring-hair">
              <canvas ref={canvasRef} width={320} height={320} className="h-44 w-44" />
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-hair bg-canvas px-3 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Ticket ID</p>
            <p className="mt-0.5 font-mono text-[13px] font-semibold text-ink">{ticket?.id || '—'}</p>
          </div>
          <div className="mt-4">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Ticket preview
            </p>
            <img
              ref={imgRef}
              alt="Downloadable ticket preview"
              className="block w-full rounded-xl border border-hair"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-soft flex-1" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary flex-1" onClick={download}>
              <Icon name="hgi-download-04" size={15} />
              Download ticket
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
