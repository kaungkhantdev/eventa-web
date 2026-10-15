import { describe, expect, it } from 'vitest'
import { insertAt } from './merge-field'

const TAG = '{{first_name}}'

/**
 * US-MSG-02: "when I place a personalization field into the text, then it
 * appears where my cursor was".
 */
describe('placing a merge field where the cursor was', () => {
  it('puts it at the start when the cursor is at the start', () => {
    expect(insertAt('Hello', TAG, 0, 0)).toEqual({
      text: '{{first_name}}Hello',
      caret: TAG.length,
    })
  })

  it('puts it mid-sentence, leaving the caret just after it', () => {
    expect(insertAt('Hi , welcome', TAG, 3, 3)).toEqual({
      text: 'Hi {{first_name}}, welcome',
      caret: 3 + TAG.length,
    })
  })

  it('replaces the selected text', () => {
    expect(insertAt('Hi there, welcome', TAG, 3, 8)).toEqual({
      text: 'Hi {{first_name}}, welcome',
      caret: 3 + TAG.length,
    })
  })

  it('puts it at the end when the cursor is at the end', () => {
    expect(insertAt('Hi ', TAG, 3, 3)).toEqual({ text: 'Hi {{first_name}}', caret: 17 })
  })

  it('falls back to the end when there is no cursor to read', () => {
    expect(insertAt('Hi ', TAG, null, null)).toEqual({ text: 'Hi {{first_name}}', caret: 17 })
  })

  it('fills an empty field', () => {
    expect(insertAt('', TAG, 0, 0)).toEqual({ text: TAG, caret: TAG.length })
  })
})
