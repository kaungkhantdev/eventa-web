import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/* Skeleton placeholder primitives. `.skeleton` (styles/components.css) supplies
   the grey block and the shimmer; every size, radius and colour override is a
   plain utility, which outranks the component layer.

   Blocks are decorative, so they are hidden from assistive tech — a screen
   reader hears the single announcement from <SkeletonScreen> instead. */

/** One grey block. Size it with utilities: `<Skeleton className="h-4 w-32" />`. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('skeleton block', className)} />
}

/** A stack of text lines; the last one is short so it reads as a paragraph. */
export function SkeletonText({
  lines = 3,
  className,
  lineClassName,
}: {
  lines?: number
  className?: string
  lineClassName?: string
}) {
  return (
    <span aria-hidden="true" className={cn('block space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className={cn(
            'skeleton block h-3',
            i === lines - 1 ? 'w-2/3' : 'w-full',
            lineClassName,
          )}
        />
      ))}
    </span>
  )
}

/** A round block — avatars, icon tiles, donut charts. */
export function SkeletonCircle({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('skeleton block rounded-full', className)} />
}

/**
 * Wraps a whole page's placeholders. Marks the region busy and announces once,
 * so the dozens of blocks inside stay silent.
 */
export function SkeletonScreen({
  label = 'Loading page',
  children,
}: {
  label?: string
  children: ReactNode
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  )
}
