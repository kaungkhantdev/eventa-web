import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

/* Slide-over panel + modal. The static kit wired these declaratively through
   data-open/data-close attributes in shell.js; here they are controlled
   components. The CSS (.panel/.modal/.panel-overlay) is unchanged, so the
   transitions are identical — the element stays mounted and `.open` drives it. */

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
}

export type PanelProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  /** Sticky footer, typically Cancel + a primary action. */
  footer?: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({
  open,
  onClose,
  title,
  subtitle,
  footer,
  className,
  children,
}: PanelProps) {
  useEscape(open, onClose)

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <aside className={cn('panel', open && 'open', className)} role="dialog" aria-modal="true">
        <header className="flex items-start gap-3 border-b border-hair px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon shrink-0"
            aria-label="Close panel"
          >
            <Icon name="hgi-cancel-01" size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-hair px-5 py-3.5">
            {footer}
          </footer>
        )}
      </aside>
    </>
  )
}

export type ModalProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, footer, className, children }: ModalProps) {
  useEscape(open, onClose)

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <div className={cn('modal', open && 'open', className)} role="dialog" aria-modal="true">
        <div className="px-5 pb-2 pt-5">
          <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
        </div>
        <div className="px-5 pb-4 text-[13px] text-muted">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-hair px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
