import { describe, expect, it } from 'vitest'
import { toTemplateCard } from './templates.mapper'
import type { MessageTemplateWire } from './templates.types'

const wire = (over: Partial<MessageTemplateWire> = {}): MessageTemplateWire => ({
  slug: 'registration-confirmation',
  title: 'Registration confirmation',
  description: 'Sent the moment a registration is paid for.',
  channels: ['email'],
  delivery: 'controlled',
  expected: true,
  active: true,
  tags: ['{{first_name}}', '{{event_name}}'],
  wording: { subjectEn: null, bodyEn: null, subjectTh: null, bodyTh: null },
  ...over,
})

describe('what an organizer may change', () => {
  it('gives a switch to a message whose switch is honoured', () => {
    const card = toTemplateCard(wire())
    expect(card.switchable).toBe(true)
    expect(card.standing).toBeNull()
  })

  it('does not claim a message is active when nothing sends it', () => {
    // `active: true` is the stored default, not a promise that mail is going
    // out. Reading "Active" here would tell an organizer their attendees are
    // getting something nobody sends.
    const card = toTemplateCard(wire({ delivery: 'planned', active: true }))
    expect(card.switchable).toBe(false)
    expect(card.standing?.label).toBe('Not sent yet')
  })

  it('shows a message that is off until switched on as off, with a switch and no warning', () => {
    // The event reminder starts off in every workspace. Off is not "Not sent
    // yet": the organizer must be able to find the switch that sends it, and
    // turning it on needs no confirmation.
    const card = toTemplateCard(
      wire({ slug: 'event-reminder', expected: false, active: false }),
    )
    expect(card.switchable).toBe(true)
    expect(card.active).toBe(false)
    expect(card.standing).toBeNull()
    expect(card.confirmOff).toBeNull()
  })
})

describe('turning a message off', () => {
  it('asks first when attendees are entitled to it', () => {
    const card = toTemplateCard(wire({ expected: true, active: true }))
    expect(card.confirmOff).not.toBeNull()
    expect(card.confirmOff?.body).toContain('Registration confirmation')
  })

  it('does not ask to turn one back ON', () => {
    // Nobody needs protecting from a message being sent.
    const card = toTemplateCard(wire({ expected: true, active: false }))
    expect(card.confirmOff).toBeNull()
  })

  it('does not ask for a message nobody is entitled to', () => {
    const card = toTemplateCard(wire({ expected: false, active: true }))
    expect(card.confirmOff).toBeNull()
  })
})

describe('the card itself', () => {
  it('shows a badge per channel the message uses', () => {
    const card = toTemplateCard(wire({ channels: ['email'] }))
    expect(card.channels).toEqual([
      { label: 'Email', icon: 'hgi-mail-01', tone: 'blue' },
    ])
  })

  it('draws SMS as the kit does — green beside a blue Email', () => {
    // The confirmation goes out on both (US-DISC-06). One tone for every
    // channel would make the two badges read as one repeated thing.
    const card = toTemplateCard(wire({ channels: ['email', 'sms'] }))
    expect(card.channels).toEqual([
      { label: 'Email', icon: 'hgi-mail-01', tone: 'blue' },
      { label: 'SMS', icon: 'hgi-smart-phone-01', tone: 'green' },
    ])
  })

  it('falls back to a known icon for a message this app has not met', () => {
    // A Hugeicons slug that does not exist renders as tofu, so an unrecognised
    // message gets a real icon rather than a guess built from its name.
    const card = toTemplateCard(wire({ slug: 'survey-invite' }))
    expect(card.icon).toBe('hgi-mail-01')
  })
})

describe('whose wording is being sent', () => {
  it('says Eventa’s own when nobody has written any', () => {
    // Empty boxes with no explanation read as something that failed to load.
    expect(toTemplateCard(wire()).edited).toBe(false)
  })

  it('notices a single field somebody wrote', () => {
    const card = toTemplateCard(
      wire({
        wording: {
          subjectEn: 'You’re in',
          bodyEn: null,
          subjectTh: null,
          bodyTh: null,
        },
      }),
    )
    expect(card.edited).toBe(true)
  })
})
