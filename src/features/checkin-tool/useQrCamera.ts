import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Reading QR codes from the device camera, for the door station (US-REG-12).
 *
 * Uses the platform's own `BarcodeDetector` rather than a bundled decoder —
 * Chromium ships it, and a scanner that costs nothing to download is one the
 * door can open on a borrowed phone. Where it is missing (Safari, Firefox) the
 * hook reports `supported: false` and the station falls back to the code box,
 * which is what a hardware scanner types into anyway.
 *
 * The kit faked all of this: a canned queue of outcomes on a timer. Nothing
 * here is simulated — a code is read off the sensor or it is not read at all.
 */

/** Minimal shape of the platform API; TypeScript's DOM lib has no types yet. */
interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource | ImageBitmapSource): Promise<DetectedBarcode[]>
}
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

const QR_FORMAT = 'qr_code'
/** Gentle enough not to heat a phone, quick enough to feel instant at a door. */
const SCAN_INTERVAL_MS = 250
/** How long the same code is ignored, so one badge is not read ten times. */
const REPEAT_GUARD_MS = 2500

function detectorCtor(): BarcodeDetectorCtor | null {
  const ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
  return typeof ctor === 'function' ? ctor : null
}

/** Camera facing: the back one reads badges, the front is for a laptop lid. */
export type Facing = 'environment' | 'user'

export interface QrCamera {
  /**
   * Put on the `<video>` as `ref={camera.attach}`.
   *
   * A callback ref rather than a `RefObject`, so no ref object crosses a prop
   * boundary — the element is handed to the hook, which keeps it privately.
   */
  attach: (el: HTMLVideoElement | null) => void
  supported: boolean
  live: boolean
  starting: boolean
  /** The browser's own refusal, shown verbatim — it says why far better. */
  error: string | null
  torchOn: boolean
  hasTorch: boolean
  facing: Facing
  start: () => void
  stop: () => void
  toggleTorch: () => void
  flip: () => void
  /** Decode a still image, for a badge photographed rather than presented. */
  decodeFile: (file: File) => void
}

export function useQrCamera(onCode: (code: string) => void): QrCamera {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const attach = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
  }, [])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const lastRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })
  // Held in a ref so the scan loop never has to be torn down and rebuilt just
  // because the page re-rendered with a new callback identity.
  const onCodeRef = useRef(onCode)
  useEffect(() => {
    onCodeRef.current = onCode
  })

  const [supported] = useState(() => detectorCtor() !== null)
  const [live, setLive] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const [facing, setFacing] = useState<Facing>('environment')

  /** One code, once — a badge held in frame produces a stream of detections. */
  const report = useCallback((code: string) => {
    const now = Date.now()
    const last = lastRef.current
    if (last.code === code && now - last.at < REPEAT_GUARD_MS) return
    lastRef.current = { code, at: now }
    onCodeRef.current(code)
  }, [])

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setLive(false)
    setTorchOn(false)
    setHasTorch(false)
  }, [])

  const start = useCallback(() => {
    const Detector = detectorCtor()
    if (!Detector) {
      setError('This browser cannot read QR codes. Use the code box below.')
      return
    }
    setStarting(true)
    setError(null)
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing }, audio: false })
      .then(async (stream) => {
        streamRef.current = stream
        const video = videoRef.current
        if (!video) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        video.srcObject = stream
        await video.play().catch(() => undefined)

        const track = stream.getVideoTracks()[0]
        // `torch` is not in the standard capability type; phones that have a
        // lamp advertise it here and laptops simply do not.
        const caps = track?.getCapabilities() as { torch?: boolean } | undefined
        setHasTorch(Boolean(caps?.torch))

        const detector = new Detector({ formats: [QR_FORMAT] })
        timerRef.current = window.setInterval(() => {
          const el = videoRef.current
          if (!el || el.readyState < 2) return
          void detector
            .detect(el)
            .then((codes) => {
              const value = codes[0]?.rawValue?.trim()
              if (value) report(value)
            })
            // A frame that will not decode is the normal case, not a fault.
            .catch(() => undefined)
        }, SCAN_INTERVAL_MS)
        setLive(true)
      })
      .catch((cause: unknown) => {
        // Shown as the browser worded it: "Permission denied" and "no camera
        // found" need different things done about them.
        setError(cause instanceof Error ? cause.message : 'The camera could not be started.')
      })
      .finally(() => setStarting(false))
  }, [facing, report])

  const toggleTorch = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const next = !torchOn
    void track
      .applyConstraints({ advanced: [{ torch: next }] } as unknown as MediaTrackConstraints)
      .then(() => setTorchOn(next))
      .catch(() => setError('This camera has no controllable lamp.'))
  }, [torchOn])

  /** Swap cameras: the stream has to be rebuilt, so stop and let the effect re-open. */
  const flip = useCallback(() => {
    const wasLive = live || starting
    stop()
    setFacing((current) => (current === 'environment' ? 'user' : 'environment'))
    if (wasLive) setStarting(true)
  }, [live, starting, stop])

  // Re-open after a flip. `starting` was set by flip() as the intent to reopen.
  useEffect(() => {
    if (starting && !live && !streamRef.current) start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing])

  const decodeFile = useCallback(
    (file: File) => {
      const Detector = detectorCtor()
      if (!Detector) {
        setError('This browser cannot read QR codes. Use the code box below.')
        return
      }
      setError(null)
      void createImageBitmap(file)
        .then((bitmap) => new Detector({ formats: [QR_FORMAT] }).detect(bitmap))
        .then((codes) => {
          const value = codes[0]?.rawValue?.trim()
          if (value) report(value)
          else setError('No QR code was found in that image.')
        })
        .catch(() => setError('That image could not be read.'))
    },
    [report],
  )

  // The camera must not outlive the screen: a light left on is both a battery
  // drain and, at a door, a privacy problem.
  useEffect(() => stop, [stop])

  return {
    attach,
    supported,
    live,
    starting,
    error,
    torchOn,
    hasTorch,
    facing,
    start,
    stop,
    toggleTorch,
    flip,
    decodeFile,
  }
}
