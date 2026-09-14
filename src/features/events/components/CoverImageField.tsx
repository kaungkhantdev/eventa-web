import { useRef, useState } from 'react'
import { messageOf } from '@/lib/api'
import { COVER_ACCEPT, rejectionOf, uploadCover } from '../coverUpload'

/**
 * The event's cover image (US-EVT-02).
 *
 * This was the kit's dropzone markup with a bare `<input type="file">` inside
 * it — no handler, no name, nothing reading it. Choosing a file did nothing at
 * all, silently, which is the worst way for an upload to not work: it looks
 * exactly like one that succeeded.
 *
 * Uploads on choice rather than on form submit. The bytes go straight to
 * storage and only a URL is saved with the event, so there is nothing to defer
 * — and an organizer who picks an image should see it, not a filename.
 */
export function CoverImageField({
  value,
  onChange,
}: {
  /** The stored URL, or '' when the event has no cover. */
  value: string
  onChange: (coverImage: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  async function take(file: File | undefined): Promise<void> {
    if (!file || busy) return
    const refusal = rejectionOf(file)
    if (refusal) {
      setError(refusal)
      return
    }
    setBusy(true)
    setError(null)
    try {
      onChange(await uploadCover(file))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
      // Cleared so choosing the SAME file again still fires a change event —
      // which is exactly what somebody does after a failure.
      if (input.current) input.current.value = ''
    }
  }

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          // Without preventDefault the browser navigates to the dropped file,
          // abandoning everything typed into the wizard so far.
          e.preventDefault()
          setDragging(false)
          void take(e.dataTransfer.files[0])
        }}
        className={[
          'mt-3 rounded-xl border-2 border-dashed transition-colors',
          dragging ? 'border-brand bg-brand-soft/40' : 'border-hair',
        ].join(' ')}
      >
        {value ? (
          <Preview url={value} busy={busy} onReplace={() => input.current?.click()} onClear={() => onChange('')} />
        ) : (
          <Dropzone busy={busy} onBrowse={() => input.current?.click()} />
        )}
      </div>

      <input
        ref={input}
        type="file"
        className="hidden"
        accept={COVER_ACCEPT}
        onChange={(e) => void take(e.target.files?.[0])}
      />

      {error && (
        <p role="alert" className="mt-2 text-[12px] text-red-500">
          {error}
        </p>
      )}
    </>
  )
}

function Dropzone({ busy, onBrowse }: { busy: boolean; onBrowse: () => void }) {
  return (
    <button
      type="button"
      onClick={onBrowse}
      disabled={busy}
      className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 p-8 text-center disabled:cursor-wait"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand">
        <i className={busy ? 'hgi-stroke hgi-loading-03 animate-spin text-[20px]' : 'hgi-stroke hgi-image-upload-01 text-[20px]'} />
      </span>
      <p className="text-[13px] font-semibold text-ink">
        {busy ? 'Uploading…' : <>Drag &amp; drop or <span className="text-brand">browse</span></>}
      </p>
      <p className="text-[11px] text-muted">Recommended 1600×900px · PNG or JPG · up to 5MB</p>
    </button>
  )
}

/**
 * What was uploaded, at the aspect ratio the landing page will use — so a badly
 * cropped image is obvious here rather than after publishing.
 */
function Preview({
  url,
  busy,
  onReplace,
  onClear,
}: {
  url: string
  busy: boolean
  onReplace: () => void
  onClear: () => void
}) {
  return (
    <div className="p-2">
      <img
        src={url}
        alt="Event cover"
        className="aspect-[16/9] w-full rounded-lg object-cover"
      />
      <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-2">
        <p className="truncate text-[11px] text-muted">
          {busy ? 'Uploading…' : 'Shown on the landing page and in discover.'}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onReplace}
            disabled={busy}
            className="text-[12px] font-semibold text-brand hover:underline disabled:text-muted"
          >
            Replace
          </button>
          <span className="text-muted">·</span>
          {/* Clears the field only. The stored object is left alone: the form
              may still be abandoned, and deleting on a click would strip the
              cover from an event whose edit was never saved. */}
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="text-[12px] font-semibold text-red-500 hover:underline disabled:text-muted"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
