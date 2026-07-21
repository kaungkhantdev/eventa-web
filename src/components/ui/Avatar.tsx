import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

/** Initials chip on the brand-soft token (`.avatar`). */
export function Avatar({
  name,
  size = 36,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn('avatar shrink-0', className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {initials(name)}
    </span>
  )
}

/** Gradient variant used for the signed-in user in page headers. */
export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        'grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-emerald-400 text-[12px] font-semibold text-white',
        className,
      )}
    >
      {initials(name)}
    </div>
  )
}
