import type { BadgeTone } from '@/components/ui'
import type { MessageChannel } from './templates.types'

/**
 * How a message channel is drawn, ported from the kit's `CHAN` map in both
 * `admin/messaging-templates.html` and `admin/messaging-log.html` — email in
 * blue, SMS in green.
 *
 * Shared by the two mappers in this feature rather than copied into each. They
 * answer different questions — which channels a template GOES OUT on, and
 * which one a logged message WENT by — but an organizer reading the templates
 * page and then the delivery log is looking at the same two things, and a
 * green SMS badge on one page and a blue one on the other would read as two
 * different facts.
 *
 * A `Record` over the channel union, so a new `message_channel` value fails
 * the build here instead of rendering as a blank badge.
 */
export interface ChannelBadge {
  label: string
  /** Hugeicons slug — keep it exact, a wrong one renders tofu. */
  icon: string
  tone: BadgeTone
}

export const CHANNEL_BADGE: Record<MessageChannel, ChannelBadge> = {
  email: { label: 'Email', icon: 'hgi-mail-01', tone: 'blue' },
  sms: { label: 'SMS', icon: 'hgi-smart-phone-01', tone: 'green' },
}
