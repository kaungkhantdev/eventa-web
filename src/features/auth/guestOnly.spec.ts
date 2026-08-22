import { describe, expect, it } from 'vitest'
import { homeForSignedIn } from './guestOnly'

describe('homeForSignedIn', () => {
  it('shows the form to somebody with no session', () => {
    expect(homeForSignedIn('admin', null)).toBeNull()
    expect(homeForSignedIn('attendee', null)).toBeNull()
  })

  it('sends a signed-in organizer away from the organizer sign-in', () => {
    expect(homeForSignedIn('admin', 'admin')).toBe('/admin/home')
  })

  it('sends a signed-in attendee away from the portal sign-in', () => {
    expect(homeForSignedIn('attendee', 'attendee')).toBe('/portal/my-events')
  })

  /**
   * The rule that stops this being a plain "is signed in" check.
   *
   * There is ONE session slot, labelled with the persona that owns it, and the
   * two audiences never share a login. Somebody holding an attendee session who
   * opens the organizer sign-in is switching, not lost — bouncing them to
   * `/portal/my-events` would make the organizer console unreachable without
   * finding the sign-out button first.
   */
  it('lets somebody signed in as the other audience through, to switch', () => {
    expect(homeForSignedIn('admin', 'attendee')).toBeNull()
    expect(homeForSignedIn('attendee', 'admin')).toBeNull()
  })
})
