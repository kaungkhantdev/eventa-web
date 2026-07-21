import { cn } from '@/lib/cn'

/* Five-star rating glyphs — the static kit's `stars(avg, size)` helper. Filled
   stars up to Math.round(avg) get the amber tint, the rest go grey. Sizes are
   mapped to literal arbitrary-value classes so Tailwind's JIT emits them. */

const STAR_SIZE: Record<number, string> = {
  11: 'text-[11px]',
  13: 'text-[13px]',
  14: 'text-[14px]',
  16: 'text-[16px]',
}

export function Stars({ avg, size }: { avg: number | null; size: number }) {
  const full = Math.round(avg ?? 0)
  const sz = STAR_SIZE[size] ?? 'text-[14px]'
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <i
          key={i}
          aria-hidden="true"
          className={cn(
            'hgi-stroke hgi-star',
            sz,
            i <= full ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600',
          )}
        />
      ))}
    </>
  )
}
