import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export function Label({ className, ...rest }: ComponentProps<'label'>) {
  return <label className={cn('label', className)} {...rest} />
}

export function Hint({ className, ...rest }: ComponentProps<'p'>) {
  return <p className={cn('hint', className)} {...rest} />
}

export function Input({ className, ...rest }: ComponentProps<'input'>) {
  return <input className={cn('input', className)} {...rest} />
}

export function Select({ className, ...rest }: ComponentProps<'select'>) {
  return <select className={cn('select', className)} {...rest} />
}

export function Textarea({ className, ...rest }: ComponentProps<'textarea'>) {
  return <textarea className={cn('textarea', className)} {...rest} />
}

/** Input with a leading Hugeicons glyph — the kit's standard search/filter
 *  control. `icon` is a Hugeicons slug. */
export function IconInput({
  icon,
  className,
  wrapperClassName,
  ...rest
}: { icon: string; wrapperClassName?: string } & ComponentProps<'input'>) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <i
        aria-hidden="true"
        className={cn(
          'hgi-stroke',
          icon,
          'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-muted',
        )}
      />
      <input className={cn('input pl-9', className)} {...rest} />
    </div>
  )
}

/** Select with a leading Hugeicons glyph, matching IconInput. */
export function IconSelect({
  icon,
  className,
  wrapperClassName,
  ...rest
}: { icon: string; wrapperClassName?: string } & ComponentProps<'select'>) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <i
        aria-hidden="true"
        className={cn(
          'hgi-stroke',
          icon,
          'pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[16px] text-muted',
        )}
      />
      <select className={cn('select pl-9', className)} {...rest} />
    </div>
  )
}
