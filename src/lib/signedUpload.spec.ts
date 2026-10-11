import { describe, expect, it, vi } from 'vitest'
import { STORAGE_PUT_FAILED, putToSignedUrl, type IssuedUpload } from './signedUpload'

/**
 * One issued upload exactly as eventa-api hands it over — the five fields
 * `ImageUploadService.presign` returns, the same five for a profile photo, a
 * workspace logo and an event cover.
 *
 * Typed rather than inferred, deliberately: this fixture is what fails first if
 * the shared shape stops matching the DTO it mirrors. The PUT below reads only
 * two of the five, which is not a reason for the type to carry three.
 */
const issued: IssuedUpload = {
  key: 'staging/abc',
  uploadUrl: 'https://storage.test/staging/abc?X-Amz-Signature=deadbeef',
  headers: { 'content-type': 'image/png', 'content-length': '2048' },
  expiresInSeconds: 300,
  maxBytes: 5_242_880,
}
const file = new Blob(['x'.repeat(2048)], { type: 'image/png' })

describe('putToSignedUrl', () => {
  it('sends the bytes to the signed URL, with the headers the API issued', async () => {
    const put = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 200 })))

    await putToSignedUrl(issued, file, { put })

    expect(put).toHaveBeenCalledTimes(1)
    const [url, init] = put.mock.calls[0]
    expect(url).toBe(issued.uploadUrl)
    expect(init?.method).toBe('PUT')
    expect(init?.body).toBe(file)
  })

  /*
   * The security property worth pinning rather than describing. `@/lib/api`
   * prefixes VITE_API_URL and attaches the bearer token; this request goes to a
   * storage host instead, and sending our access token there would hand a third
   * party a credential it has no business holding. The signed URL IS the
   * authorization for this one request, so the headers must be exactly what the
   * API issued and nothing else.
   */
  it('sends no credential of ours — exactly the issued headers, nothing added', async () => {
    const put = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 200 })))

    await putToSignedUrl(issued, file, { put })

    const sent = put.mock.calls[0][1]?.headers as Record<string, string>
    expect(sent).toEqual(issued.headers)
    expect(Object.keys(sent).map((k) => k.toLowerCase())).not.toContain('authorization')
  })

  it('reports a storage refusal rather than resolving as though it worked', async () => {
    const put = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 403 })))

    await expect(putToSignedUrl(issued, file, { put })).rejects.toThrow(STORAGE_PUT_FAILED)
  })

  it('resolves quietly when storage accepts it', async () => {
    const put = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 200 })))

    await expect(putToSignedUrl(issued, file, { put })).resolves.toBeUndefined()
  })
})
