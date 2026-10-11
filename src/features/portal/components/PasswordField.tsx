import { useState } from 'react'
import { Hint, Icon } from '@/components/ui'

/**
 * A password box with a reveal, in the portal's own classes (`.label`,
 * `.input`, `.btn-icon`) — the kit draws no password form for the portal, so
 * this is composed from the ones it draws every other field with.
 *
 * Reveal flips the input type and nothing else: no password is ever fetched
 * into this page, and none is stored by it. It exists so somebody can check
 * what they typed before committing to it, which on a *confirm* box is the
 * difference between a clear mismatch and a mystery — and on the delete
 * dialog, between an aborted deletion and a lockout.
 */
export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  hint,
}: {
  id: string
  name: string
  label: string
  autoComplete: 'current-password' | 'new-password'
  hint?: string
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={revealed ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          placeholder="••••••••"
          className="input pr-10"
        />
        <button
          type="button"
          onClick={() => setRevealed((was) => !was)}
          aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={revealed}
          className="btn-icon absolute right-1 top-1/2 -translate-y-1/2"
        >
          <Icon name={revealed ? 'hgi-view-off' : 'hgi-view'} size={16} />
        </button>
      </div>
      {hint && <Hint className="mt-1">{hint}</Hint>}
    </div>
  )
}
