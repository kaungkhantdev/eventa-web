/** The signed-in person, as `/auth/login` and `/auth/me` describe them. */
export interface Me {
  id: string
  name: string
  email: string
  persona: 'admin' | 'attendee'
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
  /** The organizer workspace. Attendees sign in without one. */
  orgSlug?: string
  rememberMe?: boolean
}
