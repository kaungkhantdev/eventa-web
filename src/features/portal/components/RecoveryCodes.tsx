import { useState } from 'react'
import { Icon } from '@/components/ui'
import { recoveryCodesText } from '../security.mapper'

/**
 * The recovery codes, shown exactly once (US-DISC-12, criterion 5).
 *
 * The API stores only their hashes, so this render is the single moment they
 * exist anywhere the reader can see. Everything about this component follows
 * from that:
 *
 * - **It says so, first and plainly.** The warning is above the codes, not
 *   under them, because somebody who closes the panel having read only the
 *   first line has still been told.
 * - **They have to be able to keep them.** Reading ten codes off a screen is
 *   not a plan, so there is a copy and a save. The file is built from a `Blob`
 *   and an object URL rather than a `data:text/plain` URL: an object URL is an
 *   opaque handle, so the codes never become part of a URL string.
 * - **Nothing else happens to them.** They are not stored, not re-read, not
 *   logged, and not sent anywhere — they arrived in one response and live in
 *   one piece of component state until the panel closes.
 */
export function RecoveryCodes({ codes, email }: { codes: readonly string[]; email: string }) {
  const [copied, setCopied] = useState<'done' | 'failed' | null>(null)
  const text = recoveryCodesText(codes, email)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied('done')
    } catch {
      // A clipboard a browser refuses is not a silent failure: the codes are
      // still on screen, and the reader has to be told to save them by hand.
      setCopied('failed')
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <p className="text-[12px] font-semibold text-amber-800 dark:text-amber-300">
          Save these now — they will not be shown again.
        </p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-amber-800/80 dark:text-amber-300/80">
          Each code signs you in once if you lose your authenticator. Keep them somewhere other
          than your phone.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-2 rounded-lg border border-hair bg-canvas p-3">
        {codes.map((code) => (
          <li
            key={code}
            className="select-all break-all font-mono text-[12.5px] tracking-wider text-ink"
          >
            {code}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button type="button" className="btn btn-soft btn-sm flex-1" onClick={() => void copy()}>
          <Icon name="hgi-copy-01" size={14} />
          {copied === 'done' ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          className="btn btn-soft btn-sm flex-1"
          onClick={() => saveText(text, 'eventa-recovery-codes.txt')}
        >
          <Icon name="hgi-download-01" size={14} />
          Save as file
        </button>
      </div>

      {copied === 'failed' && (
        <p role="alert" className="text-[12px] text-red-500">
          Your browser would not let us copy. Save the file, or write the codes down.
        </p>
      )}
    </div>
  )
}

/**
 * Hand the text to the browser as a file.
 *
 * An object URL, revoked immediately after the click — the same shape as
 * `@/lib/useDownload`'s `save`, which cannot be reused here because it starts
 * from a `Blob` the API answered with and these bytes never leave the browser.
 */
function saveText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
