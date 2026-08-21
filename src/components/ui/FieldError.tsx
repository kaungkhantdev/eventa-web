import { cn } from '@/lib/cn'

/**
 * The API's refusal about one input, under that input.
 *
 * Renders nothing when there is nothing wrong, so a form can place one after
 * every field without guarding each call site.
 *
 * `role="alert"` because it appears in response to an attempt rather than
 * being present all along — a screen reader should hear it without having to
 * walk back through the form to find out what happened. The `id` is meant to
 * be pointed at by the input's `aria-describedby`, which is what ties the two
 * together for somebody who cannot see that they are adjacent.
 */
export function FieldError({
  id,
  message,
  className,
}: {
  id?: string
  message?: string
  className?: string
}) {
  if (!message) return null

  return (
    <p id={id} role="alert" className={cn('mt-1 text-[12px] text-red-500', className)}>
      {message}
    </p>
  )
}
