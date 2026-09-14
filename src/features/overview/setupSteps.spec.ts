import { describe, expect, it } from 'vitest'
import { stepStatesOf } from './setupSteps'

describe('the setup checklist’s step states (US-DASH-01)', () => {
  describe('a step the workspace has done', () => {
    it('is ticked', () => {
      expect(stepStatesOf([true, false, false])).toEqual(['done', 'current', 'todo'])
    })

    it('is ticked even when a later one was done first', () => {
      // Nothing enforces the order — somebody can add a ticket type before
      // filling in their tax details, and the list must show what is true.
      expect(stepStatesOf([false, true, false])).toEqual(['current', 'done', 'todo'])
    })
  })

  describe('the step to do next', () => {
    it('is the first one known not to be done', () => {
      expect(stepStatesOf([true, true, false, false])).toEqual([
        'done',
        'done',
        'current',
        'todo',
      ])
    })

    it('is the very first step for a brand-new workspace', () => {
      expect(stepStatesOf([false, false, false])).toEqual(['current', 'todo', 'todo'])
    })

    it('does not exist once everything is done', () => {
      expect(stepStatesOf([true, true])).toEqual(['done', 'done'])
    })
  })

  /**
   * Null is withheld or unknown, never "not done". A step the caller may not be
   * told about must not be ticked — that would claim something the server never
   * said — and must not be highlighted either, because "do this next" is advice
   * we have no grounds to give.
   */
  describe('a step nobody can tell us about', () => {
    it('is neither ticked nor pointed at', () => {
      expect(stepStatesOf([null, null])).toEqual(['unknown', 'unknown'])
    })

    it('never becomes the current step', () => {
      expect(stepStatesOf([null, false])).toEqual(['unknown', 'current'])
    })

    it('does not stop a later step being current', () => {
      expect(stepStatesOf([true, null, false, false])).toEqual([
        'done',
        'unknown',
        'current',
        'todo',
      ])
    })

    it('claims nothing at all when the whole read failed', () => {
      // Every fact null is what a failed request looks like. Highlighting step
      // one here would tell a set-up workspace to start over.
      expect(stepStatesOf([null, null, null, null, null])).toEqual([
        'unknown',
        'unknown',
        'unknown',
        'unknown',
        'unknown',
      ])
    })
  })

  it('says nothing about no steps', () => {
    expect(stepStatesOf([])).toEqual([])
  })
})
