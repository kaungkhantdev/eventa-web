import { describe, expect, it } from 'vitest'
import { cameraFailureMessage, scannerUnavailableMessage } from './cameraFallback'
import { MANUAL_LOOKUP_LABEL } from '@/lib/constants/checkin-tool.constants'

/*
 * US-REG-12: "Given the camera can't be opened (permission denied, no camera,
 * insecure page, or camera in use), when I try to start it, then I see a
 * plain-language reason and am pointed to upload an image or search manually."
 *
 * The station used to say "Use the code box below" and "key the code in below"
 * — there is no code box — and a failed `getUserMedia` showed the browser's
 * raw message and pointed nowhere at all.
 */

/** The fallback the station really has, by the name it carries on screen. */
const MANUAL = `“${MANUAL_LOOKUP_LABEL}”`

describe('when this browser cannot read QR codes at all', () => {
  it('points to the manual lookup, which is the fallback that exists', () => {
    const message = scannerUnavailableMessage(true)

    expect(message).toContain(MANUAL)
    expect(message).not.toMatch(/code box|key the code/i)
  })

  // Upload QR decodes with the same missing detector, so it is greyed out
  // there and must not be offered.
  it('does not offer the upload, which needs the same detector', () => {
    expect(scannerUnavailableMessage(true)).not.toMatch(/upload/i)
  })

  // The detector exists only on a secure page, so on plain http the reason
  // is the page, not the browser — and the remedy is different.
  it('says so when the page is not secure, rather than blaming the browser', () => {
    const message = scannerUnavailableMessage(false)

    expect(message).toMatch(/secure/i)
    expect(message).toContain(MANUAL)
  })
})

describe('when the camera itself will not open', () => {
  const refusal = (name: string, message = 'raw browser text') =>
    new DOMException(message, name)

  it.each([
    ['NotAllowedError', /blocked|allow/i],
    ['SecurityError', /will not open the camera/i],
    ['NotFoundError', /no camera/i],
    ['OverconstrainedError', /no camera/i],
    ['NotReadableError', /in use/i],
    ['AbortError', /in use/i],
  ])('gives a plain reason for %s', (name, reason) => {
    expect(cameraFailureMessage(refusal(name))).toMatch(reason)
  })

  it.each(['NotAllowedError', 'NotFoundError', 'NotReadableError', 'SomethingNewError'])(
    'points to the upload and the manual lookup after %s',
    (name) => {
      const message = cameraFailureMessage(refusal(name))

      expect(message).toMatch(/upload/i)
      expect(message).toContain(MANUAL)
    },
  )

  // "Could not start video source" is the browser talking to a developer.
  it('does not show the browser’s own wording', () => {
    const message = cameraFailureMessage(
      refusal('NotReadableError', 'Could not start video source'),
    )

    expect(message).not.toContain('Could not start video source')
  })

  // OverconstrainedError has not always been an Error subclass in every browser.
  it('reads the reason off anything that carries a name', () => {
    expect(cameraFailureMessage({ name: 'OverconstrainedError' })).toMatch(/no camera/i)
  })

  // The lookup is keyed by a name the browser chose; one that happens to
  // match something every object has must not be read as a reason.
  it('does not mistake an inherited property for a reason', () => {
    expect(cameraFailureMessage({ name: 'constructor' })).toMatch(/camera could not be started/i)
  })

  it('still says something useful when the failure is not an error at all', () => {
    const message = cameraFailureMessage(undefined)

    expect(message).toMatch(/camera could not be started/i)
    expect(message).toContain(MANUAL)
  })
})
