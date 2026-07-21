import { useEffect, type ReactNode } from 'react'
import { Button, Icon } from '@/components/ui'
import { cn } from '@/lib/cn'

/** Centred confirm-delete modal, replicating the kit's `#del-modal` markup
 *  (alert icon, title, copy, Cancel + Delete). Controlled open/close. */
export function ConfirmDeleteModal({
  open,
  onClose,
  title,
  message,
}: {
  open: boolean
  onClose: () => void
  title: string
  message: ReactNode
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
          <p className="mt-1 text-[13px] text-muted">{message}</p>
          <div className="mt-4 flex gap-2">
            <Button variant="soft" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={onClose}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
