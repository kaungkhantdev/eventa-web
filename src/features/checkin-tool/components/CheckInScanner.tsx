import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import {
  DEFAULT_QUEUE,
  QUEUES,
  RESULTS,
  type BadgeClass,
  type FeedInput,
  type ScanOutcome,
} from '../data/checkin'
import { ManualSearch } from './ManualSearch'

/* jsQR is loaded from a CDN in the static kit. It is optional here — every
   decode path guards on `window.jsQR`, exactly as the source did, so the demo
   (camera preview, Simulate scan, manual search) works with or without it. */
declare global {
  interface Window {
    jsQR?: (
      data: Uint8ClampedArray,
      width: number,
      height: number,
      options?: { inversionAttempts?: string },
    ) => { data: string } | null
  }
}

const STAGE_STYLE = `
@keyframes scanmove { 0%{transform:translateY(0)} 50%{transform:translateY(220px)} 100%{transform:translateY(0)} }
.scan-line{ animation: scanmove 2.6s ease-in-out infinite; }
@keyframes resultpop { 0%{opacity:0;transform:scale(.94)} 100%{opacity:1;transform:scale(1)} }
.result-pop{ animation: resultpop .22s ease-out; }
@media (prefers-reduced-motion: reduce){ .scan-line{animation:none} .result-pop{animation:none} }
#cam-stage{ background: linear-gradient(180deg, rgb(var(--canvas)), rgb(var(--line))); }
#cam-stage .cam-glow{ background: radial-gradient(ellipse at center, rgb(var(--brand-soft) / .6), transparent 60%); }
#cam-stage .frame-corner{ border-color: rgb(var(--muted) / .40); }
#cam-stage #qr-ghost{ color: rgb(var(--muted) / .22); }
#cam-stage #cam-hint{ color: rgb(var(--muted)); }
#cam-stage #cam-hint b{ color: rgb(var(--ink)); }
#cam-stage .scan-line{ opacity: 0; }
#cam-stage.cam-live{ background: #0b0b0c; }
#cam-stage.cam-live .cam-glow{ background: radial-gradient(ellipse at center, rgba(255,255,255,.06), transparent 70%); }
#cam-stage.cam-live .frame-corner{ border-color: rgba(255,255,255,.85); }
#cam-stage.cam-live #qr-ghost{ color: rgba(255,255,255,.10); }
#cam-stage.cam-live #cam-hint{ color: rgba(255,255,255,.72); }
#cam-stage.cam-live #cam-hint b{ color: #fff; }
#cam-stage.cam-live .scan-line{ opacity: 1; }
`

function nowTime() {
  const d = new Date()
  return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2)
}

function resultNote(a: ScanOutcome): string {
  switch (a.state) {
    case 'dupe':
      return 'First scanned at ' + (a.at || '—') + ' today'
    case 'invalid':
      return 'This QR isn’t a valid ticket for this event.'
    case 'wrong':
      return 'Valid for “' + (a.otherEvent || 'another event') + '”, not this station.'
    case 'void':
      return 'Refunded on ' + (a.on || '—') + ' — entry denied.'
    default:
      return nowTime() + ' · Main Hall · Station 1'
  }
}

type SeenCode = { name: string; ini: string; ticket: string; at: string }
type ActiveResult = { outcome: ScanOutcome; note: string }

export function CheckInScanner({
  event,
  onCheckIn,
}: {
  event: string
  onCheckIn: (entry: FeedInput) => void
}) {
  const [streaming, setStreaming] = useState(false)
  const [camLabel, setCamLabel] = useState('Start camera')
  const [camError, setCamError] = useState<string | null>(null)
  const [result, setResult] = useState<ActiveResult | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const streamingRef = useRef(false)
  const facingRef = useRef<'environment' | 'user'>('environment')
  const cooldownRef = useRef(false)
  const torchOnRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  const scanIdxRef = useRef(0)
  const realIdxRef = useRef(0)
  const seenCodesRef = useRef<Record<string, SeenCode>>({})

  // Keep event + callback fresh for the stable RAF/scan handlers. Written in an
  // effect rather than during render: a render React discards would otherwise
  // leave the ref pointing at a value that was never shown.
  const eventRef = useRef(event)
  const onCheckInRef = useRef(onCheckIn)
  useEffect(() => {
    eventRef.current = event
    streamingRef.current = streaming
    onCheckInRef.current = onCheckIn
  })

  // switching events resets the demo cursors, exactly like the source
  useEffect(() => {
    scanIdxRef.current = 0
    realIdxRef.current = 0
    seenCodesRef.current = {}
  }, [event])

  const okPeople = useCallback(
    () => (QUEUES[eventRef.current] || DEFAULT_QUEUE).filter((e) => e.state === 'ok'),
    [],
  )

  const showResult = useCallback((a: ScanOutcome) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const def = RESULTS[a.state] || RESULTS.ok
    setResult({ outcome: a, note: a.note ?? resultNote(a) })
    if (navigator.vibrate) {
      try {
        navigator.vibrate(a.state === 'ok' ? 60 : [40, 55, 40])
      } catch {
        /* ignore */
      }
    }
    timerRef.current = window.setTimeout(() => setResult(null), def.hold)
  }, [])

  /* a real QR was read -> check in, or reject a repeat scan as a duplicate */
  const onDetect = useCallback(
    (value: string) => {
      if (cooldownRef.current) return
      cooldownRef.current = true
      const v = String(value)
      const ref = v.length > 22 ? v.slice(0, 22) + '…' : v
      const seen = seenCodesRef.current[v]
      if (seen) {
        showResult({ state: 'dupe', name: seen.name, ini: seen.ini, ticket: seen.ticket, at: seen.at })
      } else {
        const people = okPeople()
        const a: ScanOutcome | FeedInput = people.length
          ? people[realIdxRef.current % people.length]!
          : { name: 'Attendee', ini: '✓', ticket: 'Ticket', badge: 'badge-green' }
        realIdxRef.current++
        const name = a.name ?? 'Attendee'
        const ini = a.ini ?? '✓'
        const ticket = a.ticket ?? 'Ticket'
        seenCodesRef.current[v] = { name, ini, ticket, at: nowTime() }
        showResult({ state: 'ok', name, ini, ticket, note: nowTime() + ' · ' + ref })
        onCheckInRef.current({ name, ini, ticket, badge: (a.badge ?? 'badge-green') as BadgeClass })
      }
      window.setTimeout(() => {
        cooldownRef.current = false
      }, 2600)
    },
    [okPeople, showResult],
  )

  const simScan = useCallback(() => {
    const q = QUEUES[eventRef.current] || DEFAULT_QUEUE
    const a = q[scanIdxRef.current % q.length]!
    scanIdxRef.current++
    showResult(a)
    if (a.state === 'ok') {
      onCheckInRef.current({
        name: a.name ?? 'Attendee',
        ini: a.ini ?? '✓',
        ticket: a.ticket ?? 'Ticket',
        badge: (a.badge ?? 'badge-green') as BadgeClass,
      })
    }
  }, [showResult])

  const startCamera = useCallback(async () => {
    setCamError(null)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCamError(
        'This browser can’t open the camera (a secure HTTPS page is required). Use Simulate scan or manual search.',
      )
      return
    }
    setCamLabel('Starting…')
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingRef.current },
        audio: false,
      })
      streamRef.current = s
      const video = videoRef.current
      if (video) {
        video.srcObject = s
        const p = video.play()
        if (p && p.catch) p.catch(() => {})
      }
      torchOnRef.current = false
      setStreaming(true)
      setCamLabel('Stop camera')
    } catch (err) {
      setCamLabel('Start camera')
      const name = (err as { name?: string } | null)?.name ?? ''
      const msg =
        name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera access in your browser, or use Simulate scan / manual search.'
          : name === 'NotFoundError'
            ? 'No camera was found on this device.'
            : name === 'NotReadableError'
              ? 'The camera is already in use by another app.'
              : 'Couldn’t start the camera. Use Simulate scan or manual search.'
      setCamError(msg)
    }
  }, [])

  const stopCamera = useCallback(() => {
    setStreaming(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setCamLabel('Start camera')
  }, [])

  /* decode loop — runs while the camera is live */
  useEffect(() => {
    if (!streaming) return
    let raf = 0
    const loop = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && window.jsQR) {
        const w = video.videoWidth
        const h = video.videoHeight
        if (w && h) {
          const scale = Math.min(1, 480 / w)
          const cw = Math.round(w * scale)
          const ch = Math.round(h * scale)
          canvas.width = cw
          canvas.height = ch
          const cctx = canvas.getContext('2d', { willReadFrequently: true })
          if (cctx) {
            cctx.drawImage(video, 0, 0, cw, ch)
            const img = cctx.getImageData(0, 0, cw, ch)
            const code = window.jsQR(img.data, cw, ch, { inversionAttempts: 'dontInvert' })
            if (code && code.data) onDetect(code.data)
          }
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [streaming, onDetect])

  // stop the camera + timers when the page unmounts
  useEffect(
    () => () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const toggleTorch = useCallback(() => {
    const stream = streamRef.current
    if (!stream) {
      setCamError('Start the camera first to use the torch.')
      return
    }
    const track = stream.getVideoTracks()[0]
    if (!track) return
    const caps = (track.getCapabilities ? track.getCapabilities() : {}) as MediaTrackCapabilities & {
      torch?: boolean
    }
    if (!caps.torch) {
      setCamError('Torch isn’t available on this camera.')
      return
    }
    torchOnRef.current = !torchOnRef.current
    track
      .applyConstraints({
        advanced: [{ torch: torchOnRef.current }],
      } as unknown as MediaTrackConstraints)
      .catch(() => {})
  }, [])

  const flipCamera = useCallback(() => {
    facingRef.current = facingRef.current === 'environment' ? 'user' : 'environment'
    if (streamingRef.current) {
      stopCamera()
      void startCamera()
    }
  }, [startCamera, stopCamera])

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget
      const file = input.files && input.files[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      const im = new Image()
      im.onload = () => {
        const canvas = canvasRef.current
        const scale = Math.min(1, 640 / im.width)
        const cw = Math.round(im.width * scale)
        const ch = Math.round(im.height * scale)
        const cctx = canvas?.getContext('2d', { willReadFrequently: true })
        if (canvas && cctx) {
          canvas.width = cw
          canvas.height = ch
          cctx.drawImage(im, 0, 0, cw, ch)
          const img = cctx.getImageData(0, 0, cw, ch)
          const code = window.jsQR
            ? window.jsQR(img.data, cw, ch, { inversionAttempts: 'attemptBoth' })
            : null
          URL.revokeObjectURL(url)
          if (code && code.data) {
            cooldownRef.current = false
            onDetect(code.data)
            setCamError(null)
          } else {
            setCamError('No QR code found in that image.')
          }
        } else {
          URL.revokeObjectURL(url)
        }
      }
      im.onerror = () => {
        URL.revokeObjectURL(url)
        setCamError('Couldn’t read that image file.')
      }
      im.src = url
      input.value = ''
    },
    [onDetect],
  )

  const active = result?.outcome
  const activeDef = active ? RESULTS[active.state] || RESULTS.ok : null

  return (
    <section className="card overflow-hidden p-0 xl:col-span-3">
      <style>{STAGE_STYLE}</style>

      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight">Scan tickets</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            Every valid scan checks the attendee in instantly.
          </p>
        </div>
        <span
          className={cn(
            'flex shrink-0 items-center gap-1.5 text-[11px] font-semibold',
            streaming ? 'text-brand' : 'text-muted',
          )}
        >
          {streaming ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              Camera live
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-muted/50" />
              Camera off
            </>
          )}
        </span>
      </div>

      {/* viewport */}
      <div
        id="cam-stage"
        className={cn(
          'relative mx-5 mb-4 mt-1 overflow-hidden rounded-2xl border border-hair px-6 py-8 sm:py-10',
          streaming && 'cam-live',
        )}
      >
        <video
          ref={videoRef}
          id="cam"
          className={cn('absolute inset-0 h-full w-full object-cover', !streaming && 'hidden')}
          autoPlay
          playsInline
          muted
        />
        <div
          id="cam-scrim"
          className={cn(
            'pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/50',
            !streaming && 'hidden',
          )}
        />
        <div className="cam-glow pointer-events-none absolute inset-0" />

        <div className="relative mx-auto flex max-w-xs flex-col items-center">
          <div className="relative aspect-square w-full max-w-[260px]">
            <span className="frame-corner absolute left-0 top-0 h-9 w-9 rounded-tl-2xl border-l-[3px] border-t-[3px]" />
            <span className="frame-corner absolute right-0 top-0 h-9 w-9 rounded-tr-2xl border-r-[3px] border-t-[3px]" />
            <span className="frame-corner absolute bottom-0 left-0 h-9 w-9 rounded-bl-2xl border-b-[3px] border-l-[3px]" />
            <span className="frame-corner absolute bottom-0 right-0 h-9 w-9 rounded-br-2xl border-b-[3px] border-r-[3px]" />
            <div
              id="qr-ghost"
              className={cn('absolute inset-8 grid place-items-center', streaming && 'hidden')}
            >
              <i className="hgi-stroke hgi-qr-code-01 text-[120px]" />
            </div>
            <div className="scan-line absolute inset-x-3 top-2 h-[3px] rounded bg-brand shadow-[0_0_14px_2px_rgba(27,167,112,.7)]" />
          </div>
          <p id="cam-hint" className="mt-6 max-w-[260px] text-center text-[13px] font-medium">
            {streaming ? (
              'Point the camera at the attendee’s ticket QR'
            ) : (
              <>
                Camera is off — tap <b>Start camera</b> to scan tickets
              </>
            )}
          </p>
        </div>

        {/* camera error note */}
        {camError && (
          <div
            id="cam-error"
            className="absolute inset-x-4 bottom-4 mx-auto flex max-w-sm items-start gap-2 rounded-lg bg-red-600 px-3 py-2 text-left text-[12px] leading-snug text-white shadow-lg ring-1 ring-black/10"
          >
            <i className="hgi-stroke hgi-alert-02 mt-px shrink-0 text-[15px]" />
            <span>{camError}</span>
          </div>
        )}

        {/* scan result overlay */}
        {active && activeDef && (
          <div
            id="scan-result"
            className={cn(
              'result-pop absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 p-6 text-center text-white',
              activeDef.bg,
            )}
          >
            <span className="grid h-[70px] w-[70px] place-items-center rounded-full bg-white/15">
              <i className={cn('hgi-stroke', activeDef.icon, 'text-[46px]')} />
            </span>
            <p className="text-[20px] font-bold">{activeDef.title}</p>
            {active.state === 'invalid' ? (
              <div className="flex items-center gap-2.5 rounded-xl bg-white/15 px-4 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20">
                  <i className="hgi-stroke hgi-ticket-02 text-[18px]" />
                </span>
                <div className="text-left">
                  <p className="text-[14px] font-semibold leading-tight">Unrecognized code</p>
                  <p className="text-[12px] tnum text-white/80">{active.ref ?? '—'}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-xl bg-white/15 px-4 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 text-[12px] font-semibold">
                  {active.ini ?? '?'}
                </span>
                <div className="text-left">
                  <p className="text-[14px] font-semibold leading-tight">{active.name ?? 'Attendee'}</p>
                  <p className="text-[12px] text-white/80">{active.ticket ?? ''}</p>
                </div>
              </div>
            )}
            <p className="max-w-[280px] text-[12px] text-white/80">{result?.note}</p>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} id="cam-canvas" className="hidden" />

      {/* camera actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-hair px-5 py-3">
        <button
          type="button"
          onClick={() => (streaming ? stopCamera() : void startCamera())}
          className={cn('btn', streaming ? 'btn-danger' : 'btn-primary')}
        >
          <i className={cn('hgi-stroke', streaming ? 'hgi-camera-off-01' : 'hgi-camera-01', 'text-[16px]')} />
          <span>{camLabel}</span>
        </button>
        <button type="button" onClick={toggleTorch} className="btn btn-ghost" title="Torch">
          <i className="hgi-stroke hgi-flash text-[16px]" />
          <span className="hidden sm:inline">Torch</span>
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn btn-ghost"
          title="Decode a QR image"
        >
          <i className="hgi-stroke hgi-image-upload text-[16px]" />
          <span className="hidden sm:inline">Upload QR</span>
        </button>
        <button type="button" onClick={flipCamera} className="btn btn-ghost" title="Flip camera">
          <i className="hgi-stroke hgi-camera-rotated-01 text-[16px]" />
          <span className="hidden sm:inline">Flip</span>
        </button>
        <button
          type="button"
          onClick={simScan}
          className="btn btn-ghost ml-auto"
          title="Fake a detected ticket (demo)"
        >
          <i className="hgi-stroke hgi-qr-code-01 text-[16px]" />
          Simulate scan
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </div>

      {/* manual fallback */}
      <ManualSearch onCheckIn={onCheckIn} />
    </section>
  )
}
