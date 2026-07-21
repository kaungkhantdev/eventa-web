/* Hand-built single-page PDF for an invoice — no external library. Ported
   verbatim from admin/invoices.html: a byte-exact PDF-1.4 document assembled
   from raw content-stream operators, with Helvetica string widths hard-coded so
   right-aligned figures land correctly. */

import { type Invoice, statusOf, payText } from '../data/invoices'

export function buildInvoicePDF(iv: Invoice): string {
  const subA = Math.round(iv.amt / 1.07)
  const vatA = iv.amt - subA
  const st = statusOf(iv)
  const money = (n: number) => 'THB ' + n.toLocaleString('en-US')
  const GREEN = '0.106 0.655 0.439'
  const GRAY = '0.42 0.45 0.5'
  const BLACK = '0 0 0'

  const WMAP: Record<string, number> = {
    ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 191,
    '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278,
    ':': 278, ';': 278,
  }
  for (let d = 48; d <= 57; d++) WMAP[String.fromCharCode(d)] = 556

  const toAscii = (s: string) =>
    String(s == null ? '' : s)
      .replace(/[—–]/g, '-')
      .replace(/·/g, '-')
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^\x20-\x7e]/g, '?')
  const pesc = (s: string) => toAscii(s).replace(/[\\()]/g, '\\$&')
  const textW = (s: string, size: number) => {
    s = toAscii(s)
    let w = 0
    for (const c of s) w += WMAP[c] || 556
    return (w / 1000) * size
  }

  const L: string[] = []
  const txt = (x: number, y: number, size: number, font: string, s: string, rg?: string) =>
    L.push(
      'BT /' + font + ' ' + size + ' Tf ' + (rg || BLACK) + ' rg 1 0 0 1 ' + x + ' ' + y +
        ' Tm (' + pesc(s) + ') Tj ET',
    )
  const rtxt = (rx: number, y: number, size: number, font: string, s: string, rg?: string) =>
    txt(rx - textW(s, size), y, size, font, s, rg)
  const rule = (y: number) => L.push('0.85 0.85 0.85 RG 0.7 w 40 ' + y + ' m 555 ' + y + ' l S')

  txt(40, 792, 26, 'F2', 'Eventa', GREEN)
  txt(40, 774, 9, 'F1', 'Eventa Co., Ltd.', GRAY)
  txt(40, 762, 9, 'F1', '199 Sukhumvit Road, Khlong Toei, Bangkok 10110', GRAY)
  txt(40, 750, 9, 'F1', 'Tax ID 0105558001234    hello@eventa.co.th', GRAY)
  rtxt(555, 790, 20, 'F2', 'INVOICE')
  rtxt(555, 772, 11, 'F1', iv.no)
  rtxt(555, 759, 9, 'F1', 'Order ' + iv.ref, GRAY)
  rtxt(555, 746, 9, 'F1', 'Status: ' + st, GRAY)
  rule(732)
  txt(40, 712, 8.5, 'F2', 'BILL TO', GRAY)
  txt(40, 695, 12, 'F2', iv.buyer)
  txt(40, 681, 9, 'F1', iv.sub, GRAY)
  rtxt(555, 712, 9, 'F1', 'Issued    ' + iv.issued, GRAY)
  rtxt(555, 698, 9, 'F1', 'Due    ' + iv.due, GRAY)
  const ty = 642
  txt(40, ty, 8.5, 'F2', 'DESCRIPTION', GRAY)
  rtxt(555, ty, 8.5, 'F2', 'AMOUNT', GRAY)
  rule(ty - 8)
  txt(40, ty - 28, 11, 'F1', iv.ev)
  txt(40, ty - 42, 8.5, 'F1', 'Event registration & ticketing services', GRAY)
  rtxt(555, ty - 28, 11, 'F1', money(iv.amt))
  rule(ty - 58)
  let yt = ty - 84
  txt(360, yt, 10, 'F1', 'Subtotal (excl. VAT)', GRAY)
  rtxt(555, yt, 10, 'F1', money(subA))
  yt -= 18
  txt(360, yt, 10, 'F1', 'VAT 7%', GRAY)
  rtxt(555, yt, 10, 'F1', money(vatA))
  yt -= 8
  rule(yt)
  yt -= 20
  txt(360, yt, 12, 'F2', 'Total')
  rtxt(555, yt, 13, 'F2', money(iv.amt))
  txt(40, yt - 44, 9.5, 'F1', 'Payment: ' + payText(iv))
  txt(40, 92, 9, 'F1', 'Thank you for your business.', GRAY)
  txt(40, 78, 8, 'F1', 'Computer-generated invoice issued by Eventa. No signature required.', GRAY)

  const content = L.join('\n')
  const objs = [
    '<</Type /Catalog /Pages 2 0 R>>',
    '<</Type /Pages /Kids [3 0 R] /Count 1>>',
    '<</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources <</Font <</F1 4 0 R /F2 5 0 R>>>> /Contents 6 0 R>>',
    '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding>>',
    '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding>>',
    '<</Length ' + content.length + '>>\nstream\n' + content + '\nendstream',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  for (let i = 0; i < objs.length; i++) {
    offsets.push(pdf.length)
    pdf += i + 1 + ' 0 obj\n' + objs[i] + '\nendobj\n'
  }
  const xref = pdf.length
  pdf += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n'
  for (const off of offsets) pdf += ('0000000000' + off).slice(-10) + ' 00000 n \n'
  pdf += 'trailer\n<</Size ' + (objs.length + 1) + ' /Root 1 0 R>>\nstartxref\n' + xref + '\n%%EOF'
  return pdf
}

export function downloadInvoicePDF(iv: Invoice): void {
  const pdf = buildInvoicePDF(iv)
  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'Eventa-' + iv.no.replace(/[^A-Za-z0-9-]/g, '') + '.pdf'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
