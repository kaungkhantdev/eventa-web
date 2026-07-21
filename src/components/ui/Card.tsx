import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/** Surface container — rounded-2xl on the surface token. Padding is left to the
 *  caller because the kit uses p-4, p-5 and zero-padding table cards. */
export function Card({ className, ...rest }: ComponentProps<'section'>) {
  return <section className={cn('card', className)} {...rest} />
}
