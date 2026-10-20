import { SWITCH_CSS } from '@/lib/constants/portal.constants'

/**
 * The stylesheet, mounted once by the tab rather than by each switch.
 *
 * Outside the card grid, so the grid's children stay the four cards the kit
 * draws and nothing else.
 */
export function SwitchStyles() {
  return <style>{SWITCH_CSS}</style>
}

export function Switch({
  id,
  checked,
  defaultChecked,
  disabled,
  onChange,
}: {
  id?: string
  checked?: boolean
  defaultChecked?: boolean
  /**
   * Held while the save is in flight. The kit has no disabled styling and none
   * is invented — what this prevents is a second click racing the first, where
   * whichever reply landed last would decide the position of the switch.
   */
  disabled?: boolean
  onChange?: (checked: boolean) => void
}) {
  return (
    <span className="switch">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
      />
      <span className="track" />
      <span className="dot" />
    </span>
  )
}

/**
 * A switch that opens a flow instead of writing a setting.
 *
 * The two-factor switch is the one control on this tab that cannot save
 * itself: enrolling means scanning a code and proving it, and even turning it
 * off needs a current code first. So it is a real `<button>` reporting
 * `aria-checked` — which is the SERVER's answer, re-read after the flow — and
 * activating it opens the panel rather than moving the switch.
 *
 * A checkbox would have been the lie: a screen reader would announce a control
 * that toggles, and nothing it reported after a click would be true until the
 * panel had been through three steps.
 */
export function SwitchButton({
  on,
  label,
  onActivate,
  disabled,
}: {
  /** The server's answer, never the position somebody dragged it to. */
  on: boolean
  /** The accessible name — the row's title, which is not inside the button. */
  label: string
  onActivate: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onActivate}
      className="switch"
    >
      <span className="track" />
      <span className="dot" />
    </button>
  )
}
