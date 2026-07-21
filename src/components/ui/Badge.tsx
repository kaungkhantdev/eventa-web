import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'green' | 'amber' | 'red' | 'gray' | 'blue' | 'purple'

export function Badge({
  tone = 'gray',
  className,
  children,
}: {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}) {
  return <span className={cn('badge', `badge-${tone}`, className)}>{children}</span>
}
