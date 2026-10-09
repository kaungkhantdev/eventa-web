/**
 * Mirrors of the API's pgEnums, for the fields whose DTOs publish them as a
 * plain `string`.
 *
 * `@ApiProperty({ enum: … })` documents an enum without narrowing the
 * generated type, so nothing on the wire stops a four-member column being read
 * as open-ended text. Every mirror here is a hand-kept copy of
 * `eventa-api/src/db/schema/enums.ts` and must stay the same length as its
 * source: a missing member is a value that arrives anyway and finds no label.
 *
 * They live in `@/lib` rather than in a feature because more than one feature
 * reads the same column, and two features each keeping their own copy is the
 * drift this file exists to prevent.
 */

/**
 * `payment_status` — what the money did, as the database stores it.
 *
 * Read by the event workspace's registrations tab (a total pill lookup keyed on
 * `Capitalize` of these) and by the registrations queue, which compares against
 * `paid` to decide whether a rejection still holds the buyer's money. A rename
 * upstream would make that warning silently stop appearing, which is why the
 * union is worth keeping by hand.
 */
export type PaymentStatusWire = 'paid' | 'pending' | 'refunded' | 'failed'
