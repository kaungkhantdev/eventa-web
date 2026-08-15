import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { TicketShareWire } from '../tickets.types'

/**
 * The registration link and QR for one ticket type (US-TKT-06).
 *
 * Both come from the API. They used to be made up here — a hash seeded a PRNG
 * that filled a 25×25 grid, so the "QR" was noise with finder patterns stamped
 * on it and the link was a guess at a public URL. Printed on a poster, that is
 * a promise the product cannot keep: only the server knows where a tier's
 * registration page actually lives, and only a real encoder produces a code a
 * phone can read.
 *
 * This is a share link — one QR opens the sign-up page for the tier. It is not
 * a per-attendee entry pass; those are issued in Check-in.
 */

const COPY_IDLE = 'Copy link'
const COPY_DONE = 'Copied'
const COPY_RESET_MS = 1600

interface TicketQrModalProps {
  open: boolean
  onClose: () => void
  ticketName: string
  eventName: string
  /** Null while the link is still being fetched. */
  share: TicketShareWire | null
  error: string | null
}

export function TicketQrModal({
  open,
  onClose,
  ticketName,
  eventName,
  share,
  error,
}: TicketQrModalProps) {
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<number | undefined>(undefined)
  const subtitle = eventName ? `${ticketName} · ${eventName}` : ticketName

  useEffect(() => setCopied(false), [share?.registrationUrl])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  const copy = () => {
    if (!share) return
    const done = () => {
      setCopied(true)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), COPY_RESET_MS)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(share.registrationUrl).then(done, done)
    } else done()
  }

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <div className={cn('modal', open && 'open')} role="dialog" aria-modal="true">
        <div className="p-5 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
            <Icon name="hgi-qr-code-01" size={20} />
          </div>
          <h3 className="mt-3 text-[15px] font-bold tracking-tight">Share ticket type</h3>
          <p className="mt-1 text-[13px] text-muted">{subtitle}</p>

          {error ? (
            <p role="alert" className="mt-4 text-[13px] text-red-500">
              {error}
            </p>
          ) : (
            <ShareBody share={share} />
          )}

          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copy}
                className="btn btn-soft flex-1"
                disabled={!share}
              >
                <Icon name={copied ? 'hgi-tick-02' : 'hgi-copy-01'} size={15} />
                {copied ? COPY_DONE : COPY_IDLE}
              </button>
              <a
                href={share ? svgHref(share.qrSvg) : undefined}
                download={`eventa-qr-${ticketName}.svg`}
                className={cn('btn btn-soft flex-1', !share && 'pointer-events-none opacity-60')}
                aria-disabled={!share}
              >
                <Icon name="hgi-download-04" size={15} />
                Download QR
              </a>
            </div>
            <button type="button" className="btn btn-primary w-full" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function ShareBody({ share }: { share: TicketShareWire | null }) {
  if (!share) {
    return (
      <p className="mt-6 text-[13px] text-muted" aria-live="polite">
        Preparing the link…
      </p>
    )
  }

  return (
    <>
      <div className="mx-auto mt-4 w-full max-w-[210px] rounded-2xl border border-hair bg-white p-3">
        {/* The API's own SVG. It encodes `registrationUrl` and nothing else. */}
        <div
          className="aspect-square w-full overflow-hidden rounded-lg [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: share.qrSvg }}
        />
      </div>
      <div className="mx-auto mt-4 flex max-w-full items-center gap-2 rounded-lg bg-canvas px-3 py-2">
        <Icon name="hgi-link-01" size={14} className="shrink-0 text-muted" />
        <code className="min-w-0 truncate text-[12.5px] font-semibold text-ink">
          {share.registrationUrl}
        </code>
      </div>
      {share.warning && (
        <p role="alert" className="mt-3 text-[12px] text-amber-500">
          {share.warning}
        </p>
      )}
      <p className="mt-3 text-[12px] text-muted">
        Share this link or print the QR (poster, social, email) so attendees can register. Each
        buyer then gets their own unique entry QR in Check-in.
      </p>
    </>
  )
}

/** The SVG as a downloadable file, without a round trip to fetch it again. */
function svgHref(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
