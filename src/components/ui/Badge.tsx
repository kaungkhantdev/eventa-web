import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

export type BadgeTone = 'green' | 'amber' | 'red' | 'gray' | 'blue' | 'purple'

/**
 * A status pill: a tinted lozenge, and — where the caller has one — a small
 * glyph of what the status means.
 *
 * The icon is rendered here rather than passed in as a child so that its size
 * is decided once. `.badge` has always carried the `gap` for it; the static kit
 * put a glyph in every status pill, and only two of this app's tables ever did.
 *
 * The icon is decoration: it repeats the word beside it, so it stays out of the
 * accessibility tree and the label alone is what gets read out.
 */
export function Badge({
  tone = 'gray',
  icon,
  className,
  children,
}: {
  tone?: BadgeTone
  /** Hugeicons slug — keep it exact, a wrong one renders tofu. */
  icon?: string
  className?: string
  children: ReactNode
}) {
  return (
    <span className={cn('badge', `badge-${tone}`, className)}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  )
}
