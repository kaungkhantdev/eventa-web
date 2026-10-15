import type { TwoFactorStartWire, TwoFactorWire } from '@/lib/api'
import { qrDataUrl } from '@/lib/qr'

/**
 * What the console's two-factor setup panel offers (US-SET-03).
 *
 * The rules of that panel, kept out of the page so they can be tested: which
 * button mints a seed, whether the seed is on screen to scan, and whether the
 * code box that finishes setup is shown.
 */
export interface TwoFactorSetupStep {
  /** The button that mints a seed; `null` while one is on screen. */
  startLabel: 'Start setup' | 'Start over' | null
  /**
   * The seed `start` just answered with, as a QR to scan and a key to type —
   * `qr` is `null` only when the URI is too long to encode. `null` until start
   * answers: no later read returns it.
   */
  seed: { key: string; qr: string | null } | null
  canConfirm: boolean
}

export function twoFactorSetupStep(
  status: Pick<TwoFactorWire, 'pending'>,
  started: Partial<TwoFactorStartWire> | undefined,
): TwoFactorSetupStep {
  if (started?.secret) {
    const qr = started.otpauthUri ? qrDataUrl(started.otpauthUri) : null
    return { startLabel: null, seed: { key: started.secret, qr }, canConfirm: true }
  }
  // A setup left pending (the panel closed, the page reloaded) has no seed on
  // screen, and someone who never added the key cannot answer the code box —
  // so starting again is always offered. The API's start replaces the pending
  // seed. The code box stays for anyone who did add it.
  if (status.pending) return { startLabel: 'Start over', seed: null, canConfirm: true }
  return { startLabel: 'Start setup', seed: null, canConfirm: false }
}

/**
 * The toast a successful answer ends the panel with, or `null` when the panel
 * must stay open (US-SET-03). Starting setup answers with the seed to scan, in
 * this panel — closing it hid the QR behind a "Two-factor is on." that was not
 * yet true. Confirming answers with the recovery codes, which are the
 * confirmation and are shown once. Only turning two-factor off is finished.
 *
 * Decided from the answer, never the status: by the time it lands the loader
 * has revalidated, and the status already says the opposite of what changed.
 */
export function twoFactorDoneMessage(
  answer: { ok: boolean; error?: string; secret?: string; recoveryCodes?: string[] } | undefined,
): string | null {
  if (!answer?.ok || answer.secret || answer.recoveryCodes) return null
  return 'Two-factor turned off.'
}
