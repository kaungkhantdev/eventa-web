import { api, session } from '@/lib/api'
import type { Persona } from '@/lib/persona'
import { personaOfSession } from './personas'
import type { BookingClaimInput } from './signUpInput'
import type { Credentials, LoginResult, Me, WorkspaceOption } from './types'
import { FROM_BOOKING } from '@/lib/constants/auth.constants'

/**
 * A confirmed account, and where it signs in.
 *
 * `orgSlug` is the workspace for an organizer. For an attendee it is the
 * platform organization and must never be sent to `/auth/login` — attendee
 * sign-in refuses an orgSlug outright (US-DISC-08).
 */
export interface VerifiedEmail {
  verified: boolean
  orgSlug: string
  persona: Persona
}

/**
 * Whose reset link this is, from `POST /auth/reset-password/check`.
 *
 * `workspaceName` is the organizer account's workspace — an organizer with
 * accounts in several gets one link per account, so the page can say which it
 * is resetting. Always `null` for an attendee: their realm is the platform
 * organization, which is never named to them.
 */
export interface ResetLinkCheck {
  persona: Persona
  workspaceName: string | null
}

/** `GET /auth/register/from-booking/:orderId` — which account offer to make. */
export interface BookingAccount {
  /** An attendee account already uses the booking's email: offer sign-in only. */
  accountExists: boolean
}

/** `POST /auth/register/from-booking/:orderId/link` — where the claim link went. */
export interface BookingClaimLink {
  /** The booking's own address — the only inbox the link is ever sent to. */
  sentTo: string
}

/**
 * `POST /auth/register/from-booking/claim/inspect` — whose claim link this is,
 * asked when it is opened and WITHOUT spending it.
 */
export interface BookingClaim {
  /** The buyer's name, from the order. */
  name: string
  /** The address the link was sent to, from the token the API signed. */
  email: string
  /** Already claimed, or an account already used this address. */
  accountExists: boolean
}

/** What the API actually returns — flattened into `LoginResult` below. */
interface RawLogin {
  twoFactorRequired: boolean
  challengeToken?: string
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  user?: Me
  chooseWorkspace?: boolean
  workspaces?: WorkspaceOption[]
}

/**
 * Signing in, and the code step that may follow it (US-ACC-05).
 *
 * Both paths funnel through `establish`, so there is exactly one place where a
 * session begins — and the tokens are written before the caller is told it
 * worked, so a page that navigates on success can rely on the next request
 * being authenticated.
 */
/** `POST /auth/accept-invite` — `AcceptInviteResponseDto`. */
export interface AcceptedInvite {
  userId: string
  email: string
  status: string
}

export const authApi = {
  async login(credentials: Credentials): Promise<LoginResult> {
    // The persona travels inside `credentials`, built by `credentialsOf` — the
    // one place that also knows an attendee must not name a workspace.
    const raw = await api.post<RawLogin>('/auth/login', credentials, { anonymous: true })
    return establish(raw)
  },

  /** Step two: trade the challenge and a code for a session. */
  async completeTwoFactor(challengeToken: string, code: string): Promise<LoginResult> {
    const raw = await api.post<RawLogin>(
      '/auth/two-factor',
      { challengeToken, code },
      { anonymous: true },
    )
    return establish(raw)
  },

  me(): Promise<Me> {
    return api.get<Me>('/auth/me')
  },

  /**
   * Start a password reset. Resolves only when a link was sent. When none can
   * be, the API says why and this throws its `ApiError`: no account in that
   * audience (404, naming the other audience), an account that signs in with a
   * social provider or cannot sign in yet (422), too many attempts (429). The
   * API tells these apart on purpose (US-ACC-04), and its message is written
   * for the person — show it as it is.
   */
  async forgotPassword(email: string, persona: Persona): Promise<void> {
    // Stated rather than defaulted: the API looks the address up in that
    // persona's realm, so an attendee sent as an organizer is told that no
    // organizer account uses the address.
    await api.post('/auth/forgot-password', { email, persona }, { anonymous: true })
  },

  /**
   * Whether an emailed reset link can still be used, and whose it is — asked
   * when the link is opened, WITHOUT spending it (US-ACC-04).
   *
   * The token goes in the body, never a query string: a URL is what the API's
   * access log records. An invalid, expired or already-used link is a 422 whose
   * message is the reset endpoint's own, written for the person holding it.
   */
  checkResetLink(token: string): Promise<ResetLinkCheck> {
    return api.post<ResetLinkCheck>('/auth/reset-password/check', { token }, { anonymous: true })
  },

  /**
   * Finish a reset with the token from the emailed link. `newPassword` is the
   * name `ResetPasswordDto` requires — the API's whitelist refuses any other.
   * Resolves with the API's confirmation, worded for the person reading it.
   */
  /**
   * Accept a teammate's invitation: set a password and activate (US-SET-11).
   *
   * `anonymous` because the person has no session yet — the token in the
   * emailed link is the whole of their authority, and it is single-use.
   */
  acceptInvite(token: string, password: string): Promise<AcceptedInvite> {
    return api.post<AcceptedInvite>(
      '/auth/accept-invite',
      { token, password },
      { anonymous: true },
    )
  },

  resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(
      '/auth/reset-password',
      { token, newPassword },
      { anonymous: true },
    )
  },

  /**
   * Create an account. No session results: the API emails a confirmation link,
   * and the account is inert until `/auth/verify-email` is called with that
   * token.
   *
   * An organizer gets a workspace and its first owner; an attendee gets one
   * account in the platform organization and no workspace at all (US-DISC-08).
   * Which one is stated, never inferred — the same rule as sign-in.
   */
  /**
   * Ask for the confirmation link again.
   *
   * Rate-limited server-side; a 429 arrives as an ApiError with the API's own
   * wording, which is written for the person reading it.
   */
  async resendVerification(input: {
    email: string
    /** Omitted means organizer, matching the API's own default. */
    persona?: Persona
  }): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/verify-email/resend', input, {
      anonymous: true,
    })
  },

  async register(input: {
    name: string
    email: string
    password: string
    organizationName?: string
    /** Omitted means organizer, matching the API's own default. */
    persona?: Persona
    /**
     * Whether the box was actually ticked — passed through rather than
     * hard-coded. Asserting somebody's consent on their behalf is not this
     * app's to make, and the API is what refuses when it is missing.
     */
    acceptTerms: boolean
  }): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/register', input, { anonymous: true })
  },

  /**
   * Open the confirmation link from a sign-up email and activate the account.
   *
   * Anonymous: the person is by definition not signed in yet, and the token in
   * the link is the whole authorisation. The persona comes back because the two
   * audiences sign in at different pages.
   */
  verifyEmail(token: string): Promise<VerifiedEmail> {
    return api.post<VerifiedEmail>('/auth/verify-email', { token }, { anonymous: true })
  },

  /**
   * Keeping a booking's tickets in an account (US-DISC-15): whether the
   * booking's address already has one, so the order page offers sign-in
   * rather than a duplicate. By the order's id — never its human-readable
   * reference, which is printed on the ticket and easy to guess.
   */
  bookingAccount(orderId: string): Promise<BookingAccount> {
    return api.get<BookingAccount>(`${FROM_BOOKING}/${encodeURIComponent(orderId)}`, {
      anonymous: true,
    })
  },

  /**
   * Email the booking's address a one-time link to choose a password.
   *
   * No body: the API reads the address off the order, so nothing this page
   * holds can point the link at another inbox. Being able to open the order
   * page proves nothing about who reads that inbox — its id is shown to
   * whoever booked — which is why the account is made from the link, not
   * from here. A throttle or an existing account is refused in the API's own
   * words.
   */
  requestBookingClaimLink(orderId: string): Promise<BookingClaimLink> {
    return api.post<BookingClaimLink>(
      `${FROM_BOOKING}/${encodeURIComponent(orderId)}/link`,
      undefined,
      { anonymous: true },
    )
  },

  /**
   * Whose claim link this is — asked when it is opened, without spending it.
   * The token goes in the body, never a URL: a URL is what the API's access
   * log records. An invalid, expired or used link is a 400 written for the
   * person holding it.
   */
  inspectBookingClaim(token: string): Promise<BookingClaim> {
    return api.post<BookingClaim>(`${FROM_BOOKING}/claim/inspect`, { token }, { anonymous: true })
  },

  /**
   * Choose the password and create the account the link proves. Unlike
   * `register`, a session results — the link reached the inbox, which is the
   * proof a confirmation email would have asked for — and it begins in
   * `establish`, the one place every sign-in begins.
   */
  async claimBookingAccount(input: BookingClaimInput): Promise<LoginResult> {
    const raw = await api.post<RawLogin>(`${FROM_BOOKING}/claim`, input, { anonymous: true })
    return establish(raw)
  },

  /**
   * Sign out. The local session is cleared even if the call fails: the person
   * asked to be signed out of THIS browser, and a network problem must not
   * leave them looking at a console they thought they had left. The refresh
   * token is revoked server-side when the request does land.
   *
   * It never rejects: both callers navigate to sign-in once it resolves, and a
   * failure here (offline, or a refresh token already revoked or expired) used
   * to strand the person on the page they had just signed out of (US-ACC-10).
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch {
      // Signed out of this browser regardless — see above.
    } finally {
      session.end()
    }
  },
}

function establish(raw: RawLogin): LoginResult {
  // Nothing was issued: the password fits more than one workspace and the
  // caller has to say which. Deliberately checked before the token branch,
  // which would otherwise start a session on empty strings.
  if (raw.chooseWorkspace) {
    return {
      twoFactorRequired: false,
      chooseWorkspace: true,
      workspaces: raw.workspaces ?? [],
    }
  }
  if (raw.twoFactorRequired) {
    return {
      twoFactorRequired: true,
      challengeToken: raw.challengeToken ?? '',
      expiresIn: raw.expiresIn ?? 0,
    }
  }
  // The API always sends all three together on a completed sign-in; the DTO
  // marks them optional only because the two-factor branch omits them. The
  // persona is read off the user the SERVER returned, so the session is
  // labelled with who it actually is rather than who the form asked for.
  session.start({
    accessToken: raw.accessToken ?? '',
    refreshToken: raw.refreshToken ?? '',
    persona: personaOfSession(raw.user) ?? 'admin',
  })
  return {
    twoFactorRequired: false,
    accessToken: raw.accessToken ?? '',
    refreshToken: raw.refreshToken ?? '',
    user: raw.user as Me,
  }
}
