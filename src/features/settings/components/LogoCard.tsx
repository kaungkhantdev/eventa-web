import { useRef, useState } from 'react'
import { useRevalidator } from 'react-router'
import { Button, Card, Icon } from '@/components/ui'
import { messageOf } from '@/lib/api'
import { toast } from '@/lib/toast'
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

export function LogoCard({
  logoUrl,
  name,
  country,
  summary,
}: {
  logoUrl: string | null
  name: string
  country: string
  /** Counts the API derives; absent until the caller has them. */
  summary?: { eventsHosted: number; teamMembers: number }
}) {
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
      toast.success('Logo updated.')
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
      toast.success('Logo removed.')
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5">
      <h3 className="text-[14px] font-bold tracking-tight">Organization logo</h3>
      <p className="mt-0.5 text-[12px] text-muted">
        Shown on your public pages, invoices and receipts.
      </p>

      <div className="mt-3 flex items-center gap-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="h-20 w-20 shrink-0 rounded-full border border-hair object-contain"
          />
        ) : (
          // Not an empty box: the initial is what a workspace without a logo
          // already shows everywhere else. The kit's square gradient tile.
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-emerald-400 text-[28px] font-bold text-white">
            {name.trim().charAt(0).toUpperCase() || '?'}
          </span>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
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
            {/* A text link, as the kit draws it — removing a logo should not
                look as reachable as choosing one. */}
            {logoUrl && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
                className="text-[12px] font-medium text-muted transition hover:text-red-500 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-snug text-muted">
            JPEG, PNG or WebP · square looks best
          </p>
        </div>
      </div>

      {/* The kit's identity block: who this workspace is, then the two figures
          worth knowing about it. There is no plan or tier — this product has no
          billing concept, and a badge claiming one would say otherwise. */}
      <div className="mt-4 border-t border-hair pt-4">
        <p className="truncate text-[15px] font-bold tracking-tight text-ink">{name}</p>
        <p className="mt-0.5 text-[12px] text-muted">{country}</p>
      </div>

      {summary && (
        <div className="mt-4 space-y-2 border-t border-hair pt-4 text-[12px]">
          <p className="flex items-center justify-between gap-2">
            <span className="text-muted">Events hosted</span>
            <span className="tnum font-semibold text-ink">{summary.eventsHosted}</span>
          </p>
          <p className="flex items-center justify-between gap-2">
            <span className="text-muted">Team members</span>
            <span className="tnum font-semibold text-ink">{summary.teamMembers}</span>
          </p>
        </div>
      )}

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
