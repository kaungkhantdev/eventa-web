import { describe, expect, it } from 'vitest'
import { grantedSeed, toRoleCard } from './settings.mapper'
import { permissionsOf } from './settings.routes'
import type { RoleWire } from './settings.types'

const role = (over: Partial<RoleWire> = {}): RoleWire => ({
  id: 1,
  name: 'Staff',
  description: 'Works the door',
  permissions: ['evCreate'],
  neverOfferedPermissions: ['finManage'],
  memberCount: 2,
  isSystem: true,
  ...over,
})

/** The switches as the editor submits them: one hidden field per key that is on. */
const submit = (granted: ReadonlySet<string>): FormData => {
  const form = new FormData()
  form.append('intent', 'permissions')
  form.append('roleId', '1')
  for (const key of granted) form.append('permissions', key)
  return form
}

describe('permissionsOf', () => {
  /*
   * The point of the "New" marker being presentation and nothing more. A key
   * this role was never offered is switched on by the same control, carried in
   * the same set and submitted under the same field name as one it already
   * held — so answering an open question is an ordinary grant, and the `PUT`
   * that replaces the set cannot treat it as a special case.
   */
  it('submits a key the role was never offered beside the ones it already held', () => {
    const card = toRoleCard(role())
    const answered = new Set([...grantedSeed(card), 'finManage'])

    expect(permissionsOf(submit(answered))).toEqual(['evCreate', 'finManage'])
  })

  // `getAll`, not `get`: every switch that is on arrives as its own field under
  // one name, so reading a single value would send the first and silently drop
  // every other permission the role holds.
  it('reads every switch that is on, not just the first', () => {
    const granted = new Set(['evCreate', 'regView', 'finManage'])

    expect(permissionsOf(submit(granted))).toHaveLength(3)
  })

  // A role stripped of everything sends an empty list, which is what the API
  // needs to record a refusal for each key — not an omitted field.
  it('asks for nothing when every switch is off', () => {
    expect(permissionsOf(submit(new Set()))).toEqual([])
  })
})
