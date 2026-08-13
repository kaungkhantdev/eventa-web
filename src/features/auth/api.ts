import { api, session } from '@/lib/api'
import type { Credentials, LoginResult, Me } from './types'

/** What the API actually returns — flattened into `LoginResult` below. */
interface RawLogin {
  twoFactorRequired: boolean
  challengeToken?: string
  accessToken?: string
  refreshToken?: string
  expiresIn: number
  user?: Me
}

/**
 * Signing in, and the code step that may follow it (US-ACC-05).
 *
 * Both paths funnel through `establish`, so there is exactly one place where a
 * session begins — and the tokens are written before the caller is told it
 * worked, so a page that navigates on success can rely on the next request
 * being authenticated.
 */
export const authApi = {
  async login(credentials: Credentials): Promise<LoginResult> {
    const raw = await api.post<RawLogin>(
      '/auth/login',
      { ...credentials, persona: 'admin' },
      { anonymous: true },
    )
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
   * Start a password reset. Resolves the same way whether or not the address
   * has an account — the API answers uniformly on purpose, so this endpoint
   * cannot be used to discover who is registered. The page must show the same
   * confirmation either way.
   */
  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email, persona: 'admin' }, { anonymous: true })
  },

  /** Finish a reset with the token from the emailed link. */
  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password }, { anonymous: true })
  },

  /**
   * Create a workspace and its first organizer. No session results: the API
   * emails a confirmation link, and the account is inert until `/auth/verify-email`
   * is called with that token.
   */
  async register(input: {
    name: string
    email: string
    password: string
    organizationName?: string
  }): Promise<{ message: string }> {
    return api.post<{ message: string }>(
      '/auth/register',
      { ...input, acceptTerms: true },
      { anonymous: true },
    )
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
  if (raw.twoFactorRequired) {
    return {
      twoFactorRequired: true,
      challengeToken: raw.challengeToken ?? '',
      expiresIn: raw.expiresIn,
    }
  }
  // The API always sends all three together on a completed sign-in; the DTO
  // marks them optional only because the two-factor branch omits them.
  session.start({
    accessToken: raw.accessToken ?? '',
    refreshToken: raw.refreshToken ?? '',
  })
  return {
    twoFactorRequired: false,
    accessToken: raw.accessToken ?? '',
    refreshToken: raw.refreshToken ?? '',
    user: raw.user as Me,
  }
}
