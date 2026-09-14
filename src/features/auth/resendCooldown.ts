/**
 * When the "send it again" button is allowed to work again.
 *
 * Kept in storage rather than component state so a reload cannot step past it —
 * a countdown that resets with F5 is decoration. It is still only a courtesy:
 * the real limit is the API's, in Redis, because nothing in a browser can be
 * relied on. This exists so somebody who did nothing wrong sees a clear "in 42s"
 * instead of an unexplained 429.
 *
 * Keyed by address, because two people signing up on the same machine are two
 * different waits.
 *
 * The store is a parameter rather than a reach for `window`: these are the
 * rules, and rules are tested, so they must not need a browser to run.
 */

/** Matches the API's VERIFY_RESEND_COOLDOWN_SECONDS default. */
export const RESEND_COOLDOWN_MS = 60_000

const KEY_PREFIX = 'eventa:resend-until:'

export type CooldownStore = Pick<Storage, 'getItem' | 'setItem'>

/**
 * What is being re-sent. Two different sends for the same address are two
 * different waits: asking for a reset link must not open jammed because a
 * sign-up happened a moment ago. `verify` is the unlabelled original, so keys
 * the verification flow already wrote keep reading.
 */
export type ResendPurpose = 'verify' | 'reset'

function keyFor(email: string, purpose: ResendPurpose): string {
  const label = purpose === 'verify' ? '' : `${purpose}:`
  return `${KEY_PREFIX}${label}${email.toLowerCase()}`
}

/** Seconds still to wait, or 0 when the button is live. Never negative. */
export function secondsRemaining(
  email: string,
  now: number,
  store: CooldownStore | null = browserStore(),
  purpose: ResendPurpose = 'verify',
): number {
  const raw = read(store, keyFor(email, purpose))
  const until = Number(raw)
  // A hand-edited or half-written value is not a reason to jam the button.
  if (raw === null || !Number.isFinite(until)) return 0
  return Math.max(0, Math.ceil((until - now) / 1000))
}

/** Start the wait. Called when a send is accepted, not when it is attempted. */
export function startCooldown(
  email: string,
  now: number,
  store: CooldownStore | null = browserStore(),
  purpose: ResendPurpose = 'verify',
): void {
  write(store, keyFor(email, purpose), String(now + RESEND_COOLDOWN_MS))
}

/**
 * `localStorage`, when there is one to have.
 *
 * Absent under SSR, and it throws outright in Safari's private mode or with
 * site data blocked. The cool-off is a courtesy, so losing it must not cost the
 * page — every failure here degrades to "no wait recorded", and the API still
 * refuses a second send inside its own window.
 */
function browserStore(): CooldownStore | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function read(store: CooldownStore | null, key: string): string | null {
  try {
    return store?.getItem(key) ?? null
  } catch {
    return null
  }
}

function write(store: CooldownStore | null, key: string, value: string): void {
  try {
    store?.setItem(key, value)
  } catch {
    // Nothing to do, and nothing worth saying: see browserStore.
  }
}
