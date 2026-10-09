/**
 * The code box every re-verification asks for, composed from the portal's
 * `.label` / `.input` and the centred, tracked numerals the console's own
 * two-factor panel uses.
 *
 * `maxLength` is 16, not 6, and there is deliberately no `inputMode="numeric"`:
 * `TwoFactorCodeDto` takes 6 to 16 characters because a `XXXXX-XXXXX` recovery
 * code goes in the same box as a 6-digit app code — everywhere a code is
 * asked for. A numeric keypad here would be a box that refuses the one thing
 * somebody reaches for when their phone is the problem.
 *
 * `autocomplete="one-time-code"` lets a phone offer the code it was just
 * shown. Nothing typed here is kept by this app.
 */
export function CodeField({
  id,
  label,
  hint,
}: {
  id: string
  label: string
  hint?: string
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name="code"
        type="text"
        maxLength={16}
        autoComplete="one-time-code"
        autoCapitalize="characters"
        required
        placeholder="000000"
        className="input tnum text-center text-[15px] font-semibold tracking-[0.3em]"
      />
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}
