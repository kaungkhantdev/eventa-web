import { useState } from 'react'
import { api, messageOf } from '@/lib/api'
import { Button } from './Button'
import { Icon } from './Icon'

/**
 * Downloads a file the API only serves to an authenticated caller.
 *
 * A plain `<a href>` cannot do this: the export routes sit behind the same
 * bearer token as everything else, and a link sends no Authorization header —
 * the browser follows it to a 401 and shows a blank page. So the bytes are
 * fetched through `@/lib/api` (which knows about the token, and about renewing
 * it), then handed to the browser as an object URL.
 *
 * Not a loader, because nothing on screen depends on the answer: this is
 * something the organizer *did*, not something the page *shows*.
 */

interface DownloadButtonProps {
  /** API path, e.g. `/payments/export.csv`. */
  path: string
  /** Query to send with it — usually the filters the page is showing. */
  query?: Record<string, string | number | undefined>
  /** What the saved file is called. */
  filename: string
  label?: string
  className?: string
}

export function DownloadButton({
  path,
  query,
  filename,
  label = 'Export',
  className,
}: DownloadButtonProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const download = async () => {
    setBusy(true)
    setError(null)
    try {
      save(await api.download(path, { query }), filename)
    } catch (cause) {
      // Surfaced beside the button: a download that silently does nothing is
      // indistinguishable from one the browser blocked.
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" className={className} onClick={() => void download()} disabled={busy}>
        <Icon name="hgi-download-01" />
        <span className="hidden sm:inline">{busy ? 'Preparing…' : label}</span>
      </Button>
      {error && (
        <p role="alert" className="absolute right-0 top-full mt-1 w-64 text-[12px] text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
