import { cn } from '@/lib/cn'

export type IconProps = {
  /** Hugeicons slug, e.g. "hgi-calendar-add-01". */
  name: string
  /** Pixel size; the kit uses 12–20px depending on context. */
  size?: number
  className?: string
}

/** Hugeicons stroke glyph. The font is loaded from the CDN in index.html. */
export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <i
      aria-hidden="true"
      className={cn('hgi-stroke', name, className)}
      style={{ fontSize: size }}
    />
  )
}
