import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'

/* Per-ticket registration QR modal, ported from the inline <script> in
   tickets.html. The QR is a deterministic, self-contained SVG (no library):
   an FNV-1a hash seeds a mulberry32 PRNG that fills a 25×25 module grid, then
   three real finder patterns are stamped in. Copy-link and download-PNG mirror
   the original. This is a share/registration link (one QR opens the sign-up
   page for the ticket type) — not a per-attendee entry pass. */

function hashStr(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number): () => number {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const N = 25
const QUIET = 2
const CELL = 8
const SPAN = (N + QUIET * 2) * CELL

function qrModules(seed: string): boolean[][] {
  const rnd = mulberry32(hashStr(seed))
  const on: boolean[][] = []
  for (let y = 0; y < N; y++) {
    on[y] = []
    for (let x = 0; x < N; x++) on[y]![x] = rnd() > 0.52
  }
  const finder = (ox: number, oy: number) => {
    for (let y = -1; y <= 7; y++)
      for (let x = -1; x <= 7; x++) {
        const gx = ox + x
        const gy = oy + y
        if (gx < 0 || gy < 0 || gx >= N || gy >= N) continue
        let v: boolean
        if (x < 0 || x > 6 || y < 0 || y > 6) v = false // separator ring
        else if (x === 0 || x === 6 || y === 0 || y === 6) v = true // outer ring
        else if (x >= 2 && x <= 4 && y >= 2 && y <= 4) v = true // inner block
        else v = false
        on[gy]![gx] = v
      }
  }
  finder(0, 0)
  finder(N - 7, 0)
  finder(0, N - 7)
  return on
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const COPY_IDLE = 'Copy link'
const COPY_DONE = 'Copied'

export function TicketQrModal({
  open,
  onClose,
  ticketName,
  eventName,
}: {
  open: boolean
  onClose: () => void
  ticketName: string
  eventName: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<number | undefined>(undefined)

  const url = `eventa.co/e/${slug(eventName)}?ticket=${slug(ticketName)}`
  const sub = eventName ? `${ticketName} · ${eventName}` : ticketName

  const rects = useMemo(() => {
    const on = qrModules(url)
    const out: ReactNode[] = []
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++)
        if (on[y]![x])
          out.push(
            <rect
              key={`${x}-${y}`}
              x={(x + QUIET) * CELL}
              y={(y + QUIET) * CELL}
              width={CELL}
              height={CELL}
              rx={1.4}
            />,
          )
    return out
  }, [url])

  // Reset the "Copied" state whenever the modal target changes.
  useEffect(() => {
    setCopied(false)
  }, [url])

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
    const done = () => {
      setCopied(true)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 1600)
    }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, done)
    else done()
  }

  // Rasterize the inline SVG onto a canvas and download it as a PNG.
  const download = () => {
    const svg = svgRef.current
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('width', '512')
    clone.setAttribute('height', '512')
    const xml = new XMLSerializer().serializeToString(clone)
    const img = new Image()
    img.onload = () => {
      const S = 512
      const c = document.createElement('canvas')
      c.width = S
      c.height = S
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, S, S)
      ctx.drawImage(img, 0, 0, S, S)
      const a = document.createElement('a')
      a.href = c.toDataURL('image/png')
      a.download = `eventa-qr-${slug(ticketName)}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)))
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
          <p className="mt-1 text-[13px] text-muted">{sub}</p>
          <div className="mx-auto mt-4 w-full max-w-[210px] rounded-2xl border border-hair bg-white p-3">
            <div className="aspect-square w-full overflow-hidden rounded-lg">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${SPAN} ${SPAN}`}
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width={SPAN} height={SPAN} fill="#ffffff" />
                <g fill="#0b0b0c">{rects}</g>
              </svg>
            </div>
          </div>
          <div className="mx-auto mt-4 flex max-w-full items-center gap-2 rounded-lg bg-canvas px-3 py-2">
            <Icon name="hgi-link-01" size={14} className="shrink-0 text-muted" />
            <code className="min-w-0 truncate text-[12.5px] font-semibold text-ink">{url}</code>
          </div>
          <p className="mt-3 text-[12px] text-muted">
            Share this link or print the QR (poster, social, email) so attendees can register. Each
            buyer then gets their own unique entry QR in Check-in.
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <button type="button" onClick={copy} className="btn btn-soft flex-1">
                <Icon name={copied ? 'hgi-tick-02' : 'hgi-copy-01'} size={15} />
                {copied ? COPY_DONE : COPY_IDLE}
              </button>
              <button type="button" onClick={download} className="btn btn-soft flex-1">
                <Icon name="hgi-download-04" size={15} />
                Download QR
              </button>
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
