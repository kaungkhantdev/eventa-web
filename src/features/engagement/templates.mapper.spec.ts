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
    expect(card.channels).toEqual([{ label: 'Email', icon: 'hgi-mail-01' }])
  })

  it('falls back to a known icon for a message this app has not met', () => {
    // A Hugeicons slug that does not exist renders as tofu, so an unrecognised
    // message gets a real icon rather than a guess built from its name.
    const card = toTemplateCard(wire({ slug: 'survey-invite' }))
    expect(card.icon).toBe('hgi-mail-01')
  })
})
