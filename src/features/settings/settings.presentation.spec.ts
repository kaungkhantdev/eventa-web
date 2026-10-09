import { describe, expect, it } from 'vitest'
import { AUDIT_FALLBACK, auditLook, type AuditType } from './settings.presentation'

/**
 * Every value the `audit_type` pgEnum (`eventa-api/src/db/schema/enums.ts`)
 * can put on the wire, copied verbatim from it.
 *
 * They are written out as literals rather than derived from this repo's own
 * union because the union is the thing that drifted: a list taken from it would
 * only ever test itself. `satisfies` ties the two together, so a value the API
 * adds cannot be listed here without being added to the union as well.
 *
 * All twelve reach this page unchanged — `AuditEntryDto.type` is a bare
 * `string` and the audit service hands the stored column straight through.
 */
const API_AUDIT_TYPES = [
  'signin',
  'newdev',
  'pwd',
  'twofa',
  'perm',
  'xport',
  'fail',
  'apikey',
  'revoke',
  'invoice',
  'payout',
  'checkin',
] as const satisfies readonly AuditType[]

describe('auditLook', () => {
  // The fallback used to be the sign-in icon, so every type the lookup missed
  // was drawn as a sign-in: a voided invoice, a moved payout and a manual door
  // admission all appeared in the security log looking like somebody logging
  // in, which is the one thing that log must never say by accident.
  it.each(API_AUDIT_TYPES)('has a look of its own for %s', (type) => {
    expect(auditLook(type)).not.toEqual(AUDIT_FALLBACK)
  })

  it.each(API_AUDIT_TYPES.filter((type) => type !== 'signin'))(
    'does not draw %s with the sign-in icon',
    (type) => {
      expect(auditLook(type).icon).not.toBe(auditLook('signin').icon)
    },
  )

  // Three different acts, three different glyphs: whoever reconciles the log
  // has to tell a voided invoice from a moved payout from a door admission
  // without reading every line.
  it('gives the three newest kinds three different icons', () => {
    const icons = new Set(['invoice', 'payout', 'checkin'].map((type) => auditLook(type).icon))
    expect(icons.size).toBe(3)
  })

  // The fallback stays, for an entry type this build has never been taught —
  // which is now the only thing that can reach it.
  it('falls back to something neutral for a type it has never heard of', () => {
    expect(auditLook('a-type-the-api-has-never-sent')).toEqual(AUDIT_FALLBACK)
    expect(AUDIT_FALLBACK.icon).not.toBe(auditLook('signin').icon)
  })
})
