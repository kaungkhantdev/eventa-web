import { beforeEach, describe, expect, it } from 'vitest'
import { createSavedEvents, type KeyValueStore, type SavedEvents } from './savedEvents'

const KEY = 'eventa.savedEvents'

/** Stands in for the browser's storage, which the suite runs without. */
function memoryStore(): KeyValueStore & { seed(value: string): void } {
  const entries = new Map<string, string>()
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => void entries.set(key, value),
    removeItem: (key) => void entries.delete(key),
    seed: (value) => void entries.set(KEY, value),
  }
}

describe('savedEvents', () => {
  let store: ReturnType<typeof memoryStore>
  let saved: SavedEvents

  beforeEach(() => {
    store = memoryStore()
    saved = createSavedEvents(store)
  })

  it('starts empty', () => {
    expect(saved.ids()).toEqual([])
  })

  it('remembers what was saved, in the order it was saved', () => {
    saved.add('a')
    saved.add('b')
    expect(saved.ids()).toEqual(['a', 'b'])
  })

  it('saves an event once however many times the heart is pressed', () => {
    saved.add('a')
    saved.add('a')
    expect(saved.ids()).toEqual(['a'])
  })

  it('forgets one without disturbing the rest', () => {
    saved.add('a')
    saved.add('b')
    saved.remove('a')
    expect(saved.ids()).toEqual(['b'])
  })

  it('answers whether a single event is saved', () => {
    saved.add('a')
    expect(saved.has('a')).toBe(true)
    expect(saved.has('b')).toBe(false)
  })

  it('empties itself once the list has been handed to the account', () => {
    saved.add('a')
    saved.clear()
    expect(saved.ids()).toEqual([])
  })

  // Storage is shared with everything else on the origin and can be edited by
  // hand. Anything that is not a list of ids is treated as nothing saved,
  // rather than thrown at a visitor who only wanted to browse.
  describe('when the stored value is not a list of ids', () => {
    it('reads a malformed entry as empty', () => {
      store.seed('{not json')
      expect(saved.ids()).toEqual([])
    })

    it('reads a non-array as empty', () => {
      store.seed('{"a":1}')
      expect(saved.ids()).toEqual([])
    })

    it('drops entries that are not ids', () => {
      store.seed('["a",7,null,"b"]')
      expect(saved.ids()).toEqual(['a', 'b'])
    })
  })
})
