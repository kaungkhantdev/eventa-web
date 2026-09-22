import { useState } from 'react'
import { Icon, IconButton } from '@/components/ui'

/**
 * A new-password input with its show/hide toggle, markup verbatim from the
 * kit's auth/register.html (`#password` + `#toggle-pw`). Controlled, so the
 * page can score it and compare it with its confirmation; `name` puts it in the
 * submitted form.
 */
export function PasswordInput({
  id,
  name,
  value,
  onChange,
  minLength,
}: {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  minLength?: number
}) {
  const [shown, setShown] = useState(false)

  return (
    <div className="relative mt-1.5">
      <input
        id={id}
        name={name}
        type={shown ? 'text' : 'password'}
        autoComplete="new-password"
        placeholder="••••••••"
        className="input pr-10"
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <IconButton
        onClick={() => setShown((s) => !s)}
        className="absolute right-1 top-1/2 -translate-y-1/2"
        title={shown ? 'Hide password' : 'Show password'}
      >
        <Icon name={shown ? 'hgi-view-off-slash' : 'hgi-view'} size={16} />
      </IconButton>
    </div>
  )
}
