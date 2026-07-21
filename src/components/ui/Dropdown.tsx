import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/* Anchored dropdown / popover. Closes on outside-click and Escape. The trigger
   is a render-prop so the caller keeps full control of the button markup; the
   panel content may be a node or a function receiving a `close` callback (used
   so menu items can dismiss the panel on navigation). */

export function Dropdown({
  trigger,
  children,
  align = 'right',
  panelClassName,
}: {
  trigger: (args: { open: boolean; toggle: () => void }) => ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'left' | 'right'
  panelClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-50 mt-2 overflow-hidden rounded-xl border border-hair bg-surface shadow-pop',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  )
}
