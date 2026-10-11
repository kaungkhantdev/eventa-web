import { api, session } from '@/lib/api'
import type { Persona } from '@/lib/persona'
import { personaOfSession } from './personas'
import type { Credentials, LoginResult, Me, WorkspaceOption } from './types'

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
   * Sign out. The local session is cleared even if the call fails: the person
   * asked to be signed out of THIS browser, and a network problem must not
   * leave them looking at a console they thought they had left. The refresh
   * token is revoked server-side when the request does land.
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
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
