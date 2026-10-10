import type { Panel } from '@/app/panels'

/**
 * The attendee's own password, second factor and account deletion — the wire
 * shapes and the view models behind the Settings tab's Security card and its
 * danger zone (US-DISC-12 criteria 4–5, US-DISC-14).
 *
 * Wire shapes mirror eventa-api field for field; nothing outside the mapper
 * reads them. Three of them carry a secret — a shared TOTP seed and a list of
 * recovery codes — and those are modelled here precisely so it is obvious that
 * they are a RESPONSE and never a stored field: nothing in this app writes
 * them anywhere, and the API will not show either of them again.
 */

/* ------------------------------- two-factor ------------------------------ */

/**
 * The account wires come from `@/lib/api`. The organizer console reads the
 * very same `/me/*` routes from `settings`, and both files used to carry an
 * independently hand-written copy of each — which had already drifted.
 */
export type {
  LoginSessionWire,
  RecoveryCodesWire,
  TwoFactorStartWire,
  TwoFactorWire,
} from '@/lib/api'


/* ----------------------------- the danger zone --------------------------- */

/** One upcoming paid order deletion forfeits — `UpcomingPaidOrderDto`. */
export interface UpcomingPaidOrderWire {
  reference: string
  eventName: string
  startAt: string
  ticketCount: number
  /** Integer satang. */
  totalSatang: number
}

/** `GET /me/account/deletion` — `DeletionWarningDto`, the preflight. */
export interface DeletionWarningWire {
  /** True when re-verification also needs an authenticator code. */
  requiresTwoFactorCode: boolean
  upcomingPaidOrders: UpcomingPaidOrderWire[]
  /** Integer satang. */
  totalAtRiskSatang: number
}

/** `DELETE /me/account` — `DeleteAccountDto`. */
export interface DeleteAccountBody {
  /** The exact phrase, which the API checks again with `@Equals`. */
  confirm: string
  password: string
  /** Only when 2FA is enrolled; the API refuses a blank one. */
  code?: string
}

/* ------------------------------ view models ------------------------------ */

/** What the Security card's two-factor row shows. */
export interface TwoFactorCard {
  enabled: boolean
  pending: boolean
  recoveryCodesRemaining: number
  /**
   * The row's second line, derived rather than fixed: the kit's wording when
   * two-factor has never been set up, and the account's real standing
   * otherwise. A security card whose subtitle is a slogan cannot tell somebody
   * that they have no recovery codes left.
   */
  status: string
}

/** One order the reader is about to forfeit, formatted for the modal. */
export interface ForfeitedOrder {
  reference: string
  eventName: string
  /** `Jul 8, 2026 · 09:30`, Bangkok. */
  when: string
  /** `2 tickets`. */
  tickets: string
  /** `฿1,880`. */
  amount: string
}

/** What the danger zone has to say before anybody confirms (US-DISC-14). */
export interface DeletionWarning {
  requiresTwoFactorCode: boolean
  orders: ForfeitedOrder[]
  /**
   * `฿1,880`, or `null` when there is nothing to forfeit.
   *
   * Not `฿0` and not "Free": "you will lose nothing" is a different sentence
   * from "you will lose no money", and the modal omits the line entirely
   * rather than price an empty list.
   */
  totalAtRisk: string | null
}

/**
 * Everything the Security card and the danger zone read, mapped at the edge.
 *
 * Each is a `Panel`, for the reason the notification switches are: these are
 * supplementary reads on a page whose subject is somebody's tickets, and a
 * flaky security endpoint must not take those away. Each also has an answer
 * that is worth refusing to guess —
 *
 * - `twoFactor`: a switch drawn in a guessed position tells somebody their
 *   second factor is off when it is on, which is the one wrong answer a
 *   security card must not give.
 * - `otherDevices`: a count nobody could read is not "no other devices".
 * - `deletion`: criterion 2 of US-DISC-14 is a WARNING. Without it the danger
 *   zone cannot say what is forfeited, so it offers no deletion at all rather
 *   than an irreversible button over an unknown consequence.
 */
export interface AttendeeSecurity {
  twoFactor: Panel<TwoFactorCard>
  /** How many devices other than this one hold a session. */
  otherDevices: Panel<number>
  deletion: Panel<DeletionWarning>
}
