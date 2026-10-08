import { cn } from '@/lib/cn'
import { STRENGTH_COLORS, STRENGTH_TEXTS, scorePassword } from '../passwordStrength'

/**
 * The three-bar strength meter under a new password, markup verbatim from the
 * kit's auth/register.html (`#pw-bar-1..3` + `#pw-label`). The score is
 * `scorePassword`'s — this only draws it; the API's refusal is what counts.
 */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = scorePassword(password)
  const color = score > 0 ? STRENGTH_COLORS[score as 1 | 2 | 3] : undefined

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex h-1 flex-1 gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn('h-full flex-1 rounded-full transition-colors', i >= score && 'bg-line')}
            style={i < score ? { background: color } : undefined}
          />
        ))}
      </div>
      <span
        className="text-[11px] font-medium text-muted"
        style={color ? { color } : undefined}
      >
        {STRENGTH_TEXTS[score]}
      </span>
    </div>
  )
}
