import { useRef, useState } from 'react'
import { useRevalidator } from 'react-router'
import { Button, Card, Icon } from '@/components/ui'
import { messageOf } from '@/lib/api'
import { accountApi } from '../settings.routes'

/**
 * The workspace logo (US-SET-07) — what attendees see on public pages,
 * invoices and receipts.
 *
 * The file goes straight from the browser to storage, using a short-lived URL
 * the API signs. It never passes through this app, which is why there is no
 * form post here and no multipart body anywhere: ask, PUT, confirm.
 *
 * The API is what actually decides whether the bytes are an image. The checks
 * here are a courtesy so somebody learns before uploading rather than after —
 * they are not the guard, and are not treated as one.
 */

/** Kept in step with the API's own allow-list. */
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export function LogoCard({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  const file = useRef<HTMLInputElement>(null)
  const revalidator = useRevalidator()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(chosen: File): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      const issued = await accountApi.logoUploadUrl(chosen.type, chosen.size)
      const put = await fetch(issued.uploadUrl, {
        method: 'PUT',
        // Verbatim: they are covered by the signature, so changing or adding
        // one makes the upload fail.
        headers: issued.headers,
        body: chosen,
      })
      if (!put.ok) throw new Error('The upload could not be sent to storage.')
      await accountApi.confirmLogo(issued.key)
      // The loader owns this page's data; re-read rather than keeping a copy.
      await revalidator.revalidate()
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }

  async function remove(): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      await accountApi.removeLogo()
      await revalidator.revalidate()
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mt-4 p-5">
      <h3 className="text-[14px] font-bold tracking-tight">Logo</h3>
      <p className="mt-0.5 text-[12px] text-muted">
        Shown on your public pages, invoices and receipts.
      </p>

      <div className="mt-4 flex items-center gap-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="h-16 w-16 shrink-0 rounded-xl border border-hair object-contain"
          />
        ) : (
          // Not an empty box: the initial is what a workspace without a logo
          // already shows everywhere else.
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-brand-soft text-[22px] font-bold text-brand">
            {name.trim().charAt(0).toUpperCase() || '?'}
          </span>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="soft"
            size="sm"
            type="button"
            disabled={busy}
            onClick={() => file.current?.click()}
          >
            <Icon name="hgi-image-upload" size={15} />
            {logoUrl ? 'Replace' : 'Upload'}
          </Button>
          {logoUrl && (
            <Button variant="ghost" size="sm" type="button" disabled={busy} onClick={() => void remove()}>
              Remove
            </Button>
          )}
        </div>
      </div>

      <p className="mt-3 text-[11.5px] text-muted">
        JPEG, PNG or WebP. A square image looks best.
      </p>

      {busy && <p className="mt-2 text-[12px] text-muted">Working…</p>}
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-red-500">
          {error}
        </p>
      )}

      <input
        ref={file}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(e) => {
          const chosen = e.target.files?.[0]
          // Cleared first: picking the same file twice must fire again.
          e.target.value = ''
          if (chosen) void upload(chosen)
        }}
      />
    </Card>
  )
}
