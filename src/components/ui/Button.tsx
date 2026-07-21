import type { ComponentProps, ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'ghost' | 'soft' | 'danger'
export type ButtonSize = 'md' | 'sm'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  soft: 'btn-soft',
  danger: 'btn-danger',
}

function classes(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn('btn', VARIANT[variant], size === 'sm' && 'btn-sm', className)
}

type BaseProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  children?: ReactNode
}

export function Button({
  variant = 'ghost',
  size = 'md',
  className,
  ...rest
}: BaseProps & ComponentProps<'button'>) {
  return <button type="button" className={classes(variant, size, className)} {...rest} />
}

/** Same visual treatment, but navigates. */
export function ButtonLink({
  variant = 'ghost',
  size = 'md',
  className,
  ...rest
}: BaseProps & ComponentProps<typeof Link>) {
  return <Link className={classes(variant, size, className)} {...rest} />
}

/** Square icon-only button (32×32) used in toolbars and table rows. */
export function IconButton({ className, ...rest }: ComponentProps<'button'>) {
  return <button type="button" className={cn('btn-icon', className)} {...rest} />
}
