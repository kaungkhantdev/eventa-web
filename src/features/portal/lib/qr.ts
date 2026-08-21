import qrcode from 'qrcode-generator'

/**
 * QR codes the portal has to draw itself.
 *
 * Both the ticket pass and a PromptPay payment arrive as the *payload* rather
 * than as a picture — a ticket token, and the EMV string a Thai banking app
 * expects. Rendering is this app's job; inventing the contents never is.
 */

export type QRCode = ReturnType<typeof qrcode>

/** `null` when the payload is too long to encode, rather than throwing. */
export function makeQR(text: string): QRCode | null {
  try {
    const code = qrcode(0, 'M')
    code.addData(text)
    code.make()
    return code
  } catch {
    return null
  }
}

/** How many screen pixels one module of the code occupies. */
const CELL_SIZE = 4
const MARGIN = 2

/** A payload → a `data:` image an `<img>` can show. `null` if it cannot encode. */
export function qrDataUrl(payload: string): string | null {
  return makeQR(payload)?.createDataURL(CELL_SIZE, MARGIN) ?? null
}
