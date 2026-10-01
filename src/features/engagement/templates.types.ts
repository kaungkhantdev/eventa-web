/**
 * What `/message-templates` returns (US-MSG-01).
 *
 * The API owns the catalog: which automated messages exist, which are actually
 * being sent, and which ones attendees are entitled to. This app owns how that
 * reads on screen.
 */

export type MessageChannel = 'email' | 'sms'

/**
 * How much say an organizer has over one message.
 *
 * - `controlled` — sent today, and eventa-worker checks the switch first.
 * - `planned` — nothing sends it yet, so there is nothing to switch.
 */
export type TemplateDelivery = 'controlled' | 'planned'

/** What an organizer has written. Null means Eventa's own copy is used. */
export interface TemplateWording {
  subjectEn: string | null
  bodyEn: string | null
  subjectTh: string | null
  bodyTh: string | null
}

export interface MessageTemplateWire {
  slug: string
  title: string
  description: string
  channels: MessageChannel[]
  delivery: TemplateDelivery
  /** A message attendees are entitled to — switching it off asks first. */
  expected: boolean
  active: boolean
  /** Merge fields this message can fill. Empty for one nothing sends. */
  tags: string[]
  wording: TemplateWording
}
