import type { Persona } from '@/lib/persona'

/** The signed-in person, as `/auth/login` and `/auth/me` describe them. */
export interface Me {
  id: string
  name: string
  email: string
  persona: Persona
  status: 'Active' | 'Invited' | 'Suspended'
  twoFactorEnabled: boolean
  organization: {
    id: number
    name: string
    slug: string
    currency: string
    timezone: string
    locale: 'en' | 'th'
  }
  /** Granted permission keys — what the console may show and offer. */
  permissions: string[]
}

/**
 * A login answers one of two ways (US-ACC-05): a session, or a demand for a
 * code. Modelled as a discriminated union so a caller cannot read
 * `accessToken` off a response that never had one.
 */
export type LoginResult =
  | { twoFactorRequired: false; accessToken: string; refreshToken: string; user: Me }
  | { twoFactorRequired: true; challengeToken: string; expiresIn: number }

export interface Credentials {
  email: string
  password: string
  /** Which audience is signing in — the two never share a login. */
  persona: Persona
  /**
   * The organizer workspace. Absent for an attendee, who has one platform-wide
   * realm: sending it is refused with a 422, not ignored.
   */
  orgSlug?: string
  rememberMe?: boolean
}
