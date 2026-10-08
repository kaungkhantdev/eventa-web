import type { FileDownload } from '@/lib/exportFormats'
import { useDownload, type DownloadQuery } from '@/lib/useDownload'
import { Button } from './Button'
import { Dropdown } from './Dropdown'
import { Icon } from './Icon'

/**
 * Export the view as one of several files (US-RPT-11).
 *
 * The same control as `DownloadButton` until it is opened, because to the
 * reader it is the same action — they are choosing a format, not a different
 * feature. Each item downloads through `useDownload`, so a refusal (a staff
 * member reaching for a finance report) shows the API's own message rather
 * than a file that never arrives.
 */

interface ExportMenuProps {
  /** Every format of one report, from `fileDownloads`. */
  downloads: readonly FileDownload[]
  /** Query to send with it — the filters the page is showing. */
  query?: DownloadQuery
  label?: string
  className?: string
}

export function ExportMenu({ downloads, query, label = 'Export', className }: ExportMenuProps) {
  const { busy, error, download } = useDownload()

  return (
    <div className="relative">
      <Dropdown
        panelClassName="w-40 py-1"
        trigger={({ open, toggle }) => (
          <Button
            variant="ghost"
            className={className}
            onClick={toggle}
            disabled={busy}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <Icon name="hgi-download-01" />
            <span className="hidden sm:inline">{busy ? 'Preparing…' : label}</span>
          </Button>
        )}
      >
        {(close) =>
          downloads.map((file) => (
            <button
              key={file.format}
              type="button"
              role="menuitem"
              onClick={() => {
                close()
                void download(file.path, file.filename, query)
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-[12.5px] font-medium text-ink transition hover:bg-line"
            >
              <Icon name="hgi-file-01" size={16} className="text-muted" />
              {file.label}
            </button>
          ))
        }
      </Dropdown>
      {error && (
        <p role="alert" className="absolute right-0 top-full mt-1 w-64 text-[12px] text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
