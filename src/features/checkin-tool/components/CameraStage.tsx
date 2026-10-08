import { useRef } from 'react'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { QrCamera } from '../useQrCamera'

/**
 * The scanner viewport (checkin-tool.html). Markup and class strings copied
 * from the kit; the behaviour behind them is real.
 *
 * The kit's "Simulate scan" button is deliberately absent. It existed so the
 * static page could always appear to work; here a code comes off the sensor or
 * off a photograph, and if neither happens the screen says so rather than
 * inventing an arrival.
 */
export function CameraStage({ camera, busy }: { camera: QrCamera; busy: boolean }) {
  const file = useRef<HTMLInputElement>(null)
  // Pulled apart rather than read through `camera.x` in the markup: `attach` is
  // a callback ref, and a linter cannot tell a ref-bearing object from a ref.
  const { attach, live, starting, supported, error, hasTorch, torchOn } = camera

  return (
    <>
      <div
        className={cn(
          'cam-stage relative mx-5 mb-4 mt-1 overflow-hidden rounded-2xl border border-hair px-6 py-8 sm:py-10',
          live && 'cam-live',
        )}
      >
        <video
          ref={attach}
          className={cn('absolute inset-0 h-full w-full object-cover', !live && 'hidden')}
          autoPlay
          playsInline
          muted
        />
        {live && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/50" />
        )}
        <div className="cam-glow pointer-events-none absolute inset-0" />

        <div className="relative mx-auto flex max-w-xs flex-col items-center">
          <div className="relative aspect-square w-full max-w-[260px]">
            <span className="frame-corner absolute left-0 top-0 h-9 w-9 rounded-tl-2xl border-l-[3px] border-t-[3px]" />
            <span className="frame-corner absolute right-0 top-0 h-9 w-9 rounded-tr-2xl border-r-[3px] border-t-[3px]" />
            <span className="frame-corner absolute bottom-0 left-0 h-9 w-9 rounded-bl-2xl border-b-[3px] border-l-[3px]" />
            <span className="frame-corner absolute bottom-0 right-0 h-9 w-9 rounded-br-2xl border-b-[3px] border-r-[3px]" />
            <div className="qr-ghost absolute inset-8 grid place-items-center">
              <Icon name="hgi-qr-code-01" size={120} />
            </div>
            <div className="scan-line absolute inset-x-3 top-2 h-[3px] rounded bg-brand shadow-[0_0_14px_2px_rgba(27,167,112,.7)]" />
          </div>
          <p className="cam-hint mt-6 max-w-[260px] text-center text-[13px] font-medium">
            <Hint camera={camera} busy={busy} />
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="absolute inset-x-4 bottom-4 mx-auto flex max-w-sm items-start gap-2 rounded-lg bg-red-600 px-3 py-2 text-left text-[12px] leading-snug text-white shadow-lg ring-1 ring-black/10"
          >
            <Icon name="hgi-alert-02" size={14} className="mt-px shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-hair px-5 py-3">
        <button
          type="button"
          className="btn btn-primary"
          onClick={live ? camera.stop : camera.start}
          disabled={!supported || starting}
        >
          <Icon name="hgi-camera-01" size={16} />
          {live ? 'Stop camera' : starting ? 'Starting…' : 'Start camera'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          title="Torch"
          onClick={camera.toggleTorch}
          disabled={!live || !hasTorch}
          aria-pressed={torchOn}
        >
          <Icon name="hgi-flash" size={16} />
          <span className="hidden sm:inline">Torch</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          title="Decode a QR image"
          onClick={() => file.current?.click()}
          disabled={!supported}
        >
          <Icon name="hgi-image-upload" size={16} />
          <span className="hidden sm:inline">Upload QR</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          title="Flip camera"
          onClick={camera.flip}
          disabled={!live}
        >
          <Icon name="hgi-camera-rotated-01" size={16} />
          <span className="hidden sm:inline">Flip</span>
        </button>
        <input
          ref={file}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const chosen = e.target.files?.[0]
            if (chosen) camera.decodeFile(chosen)
            e.target.value = ''
          }}
        />
      </div>
    </>
  )
}

/** What the viewport says it is doing, in the kit's own words where they fit. */
function Hint({ camera, busy }: { camera: QrCamera; busy: boolean }) {
  if (!camera.supported) {
    return <>This browser cannot use the camera — key the code in below instead</>
  }
  if (busy) return <>Checking that ticket…</>
  if (camera.live) return <>Hold the ticket’s QR code inside the frame</>
  return (
    <>
      Camera is off — tap <b>Start camera</b> to scan tickets
    </>
  )
}

/** The kit's "Camera off" pill, beside the card's heading. */
export function CameraStatus({ camera }: { camera: QrCamera }) {
  const label = !camera.supported
    ? 'Camera unavailable'
    : camera.live
      ? 'Camera live'
      : camera.starting
        ? 'Starting…'
        : 'Camera off'

  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-muted">
      <span
        className={cn('h-2 w-2 rounded-full', camera.live ? 'bg-brand' : 'bg-muted/50')}
      />
      {label}
    </span>
  )
}
