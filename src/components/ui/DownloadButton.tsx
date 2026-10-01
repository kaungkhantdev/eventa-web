import { useDownload, type DownloadQuery } from '@/lib/useDownload'
import { Button } from './Button'
import { Icon } from './Icon'

/**
 * One file, fetched with the caller's token and handed to the browser.
 *
 * For a route that serves a single format. Where the reader may choose between
 * CSV, Excel and PDF, use `ExportMenu` — both share `useDownload`, so the
 * busy state and the error live in one place.
 */

interface DownloadButtonProps {
  /** API path, e.g. `/payments/export.csv`. */
  path: string
  /** Query to send with it — usually the filters the page is showing. */
  query?: DownloadQuery
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
  const { busy, error, download } = useDownload()

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className={className}
        onClick={() => void download(path, filename, query)}
        disabled={busy}
      >
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
