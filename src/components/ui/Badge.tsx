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
  title,
  className,
  children,
}: {
  tone?: BadgeTone
  /** Hugeicons slug — keep it exact, a wrong one renders tofu. */
  icon?: string
  /**
   * The long form, for a pill whose one word needs it. A hover tooltip is an
   * extra, never the only place a meaning is written — it reaches neither a
   * keyboard nor a touch screen, so the caller still names the thing properly.
   */
  title?: string
  className?: string
  children: ReactNode
}) {
  return (
    <span className={cn('badge', `badge-${tone}`, className)} title={title}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  )
}
