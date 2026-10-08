import { useEffect, type ReactNode } from 'react'
import { Button, Icon } from '@/components/ui'
import { cn } from '@/lib/cn'

/**
 * Centred confirm-delete modal, replicating the kit's `#del-modal` markup.
 *
 * `message` doubles as the place a refusal is shown: the API answers a delete
 * it will not do with a sentence written for the person reading it ("retire it
 * instead — 210 attendees hold this ticket"), and showing that in place of the
 * warning keeps the answer where the question was asked.
 */
export function ConfirmDeleteModal({
  open,
  onClose,
  title,
  message,
  onConfirm,
  confirmLabel = 'Delete',
  tone = 'default',
}: {
  open: boolean
  onClose: () => void
  title: string
  message: ReactNode
  /** Omitted while a page has nothing to delete yet — the button then closes. */
  onConfirm?: () => void
  confirmLabel?: string
  /** `error` marks the message as a refusal rather than a warning. */
  tone?: 'default' | 'error'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <div className={cn('modal', open && 'open')} role="dialog" aria-modal="true">
        <div className="p-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300">
            <Icon name="hgi-alert-01" size={18} />
          </div>
          <h3 className="mt-3 text-[15px] font-bold tracking-tight">{title}</h3>
          <p
            className={cn('mt-1 text-[13px]', tone === 'error' ? 'text-red-500' : 'text-muted')}
            role={tone === 'error' ? 'alert' : undefined}
          >
            {message}
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="soft" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={onConfirm ?? onClose}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
