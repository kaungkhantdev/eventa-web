import { describe, expect, it } from 'vitest'
import { workspaceMark } from './workspaceMark'

/*
 * The mark at the top of the console's icon rail. It used to be hard-coded
 * demo text ("EC", "Eventa Co., Ltd.") whatever workspace was signed in.
 */
describe('workspaceMark', () => {
  it('shows the workspace’s logo, named by the workspace', () => {
    const logo = 'http://localhost:9000/eventa-uploads/org/1/logos/a.png'
    expect(workspaceMark({ name: 'Testing One', logoUrl: logo })).toEqual({
      logo,
      initials: 'TO',
      label: 'Testing One',
    })
  })

  it('falls back to the workspace’s initials when it has no logo', () => {
    expect(workspaceMark({ name: 'Testing One', logoUrl: null })).toMatchObject({
      logo: null,
      initials: 'TO',
    })
  })

  // An API that predates the field sends no logoUrl at all.
  it('treats a missing logo as none', () => {
    expect(workspaceMark({ name: 'Acme' }).logo).toBeNull()
  })

  it('has nothing to show before anyone is signed in', () => {
    expect(workspaceMark(null)).toEqual({ logo: null, initials: '', label: '' })
  })
})
