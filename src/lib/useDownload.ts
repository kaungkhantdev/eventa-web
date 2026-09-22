import { useState } from 'react'
import { api, messageOf } from '@/lib/api'

/**
 * Fetches a file the API only serves to an authenticated caller.
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

export type DownloadQuery = Record<string, string | number | undefined>

export function useDownload() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const download = async (path: string, filename: string, query?: DownloadQuery) => {
    setBusy(true)
    setError(null)
    try {
      save(await api.download(path, { query }), filename)
    } catch (cause) {
      // Surfaced beside the control: a download that silently does nothing is
      // indistinguishable from one the browser blocked.
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }

  return { busy, error, download }
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
