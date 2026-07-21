/* Real QR + downloadable ticket flyer, ported from the inline <script> in
   my-events.html. `makeQR`/`drawQR` render the modal's plain QR canvas;
   `buildFlyer` paints the vibrant retro-funk concert stub used for the modal
   preview image and the PNG download. Only the helpers actually reached by
   buildFlyer are carried over — the static file left several unused. */

import qrcode from 'qrcode-generator'

type QRCode = ReturnType<typeof qrcode>
type Ctx = CanvasRenderingContext2D

export type FlyerTicket = {
  id: string
  event: string
  date: string
  venue: string
  type: string
  attendee: string
  payload: string
}

export function makeQR(text: string): QRCode | null {
  try {
    const q = qrcode(0, 'M')
    q.addData(text)
    q.make()
    return q
  } catch {
    return null
  }
}

export function drawQR(
  ctx: Ctx,
  qr: QRCode | null,
  x: number,
  y: number,
  size: number,
  dark = '#0b1220',
  light = '#ffffff',
) {
  ctx.fillStyle = light
  ctx.fillRect(x, y, size, size)
  if (!qr) return
  const n = qr.getModuleCount()
  const margin = 2
  const cell = size / (n + margin * 2)
  ctx.fillStyle = dark
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c))
        ctx.fillRect(x + (c + margin) * cell, y + (r + margin) * cell, cell + 0.6, cell + 0.6)
    }
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(ctx: Ctx, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = String(text).split(' ')
  let line = ''
  let yy = y
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i]!
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy)
      line = words[i]!
      yy += lh
    } else line = test
  }
  ctx.fillText(line, x, yy)
  return yy
}

/** text helper: font + color + align + optional letter-spacing (auto-reset) */
function txt(
  ctx: Ctx,
  s: string,
  x: number,
  y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = 'left',
  track = 0,
) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = align
  if ('letterSpacing' in ctx) ctx.letterSpacing = track + 'px'
  ctx.fillText(s, x, y)
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'
}

type When = {
  wdFull: string
  mon: string
  day: string
  year: string
  time: string
  doors: string
  kicker: string
}

/** parse "Sun, Jul 12, 2026 · 19:30" → date parts + doors (start − 30 min) */
function parseWhen(s: string): When {
  const o: When = { wdFull: '', mon: '', day: '', year: '', time: '', doors: '', kicker: '' }
  const parts = String(s || '').split('·')
  o.time = (parts[1] || '').trim()
  const toks = (parts[0] || '')
    .replace(/,/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const WD: Record<string, string> = {
    Sun: 'SUNDAY',
    Mon: 'MONDAY',
    Tue: 'TUESDAY',
    Wed: 'WEDNESDAY',
    Thu: 'THURSDAY',
    Fri: 'FRIDAY',
    Sat: 'SATURDAY',
  }
  o.wdFull = WD[toks[0]!] || (toks[0] || '').toUpperCase()
  o.mon = (toks[1] || '').toUpperCase()
  o.day = toks[2] || ''
  o.year = toks[3] || ''
  const m = /(\d{1,2}):(\d{2})/.exec(o.time)
  if (m) {
    let mins = +m[1]! * 60 + +m[2]! - 30
    if (mins < 0) mins += 1440
    o.doors = ('0' + Math.floor(mins / 60)).slice(-2) + ':' + ('0' + (mins % 60)).slice(-2)
  }
  o.kicker = o.wdFull + (o.mon ? ' · ' + o.mon + ' ' + o.day : '')
  return o
}

/** derive real-ticket fields from the ticket id + type + venue */
function derive(t: FlyerTicket) {
  const vip = /vip/i.test(t.type || '')
  const parts = String(t.id).split('-')
  const seq = parts[2] || '00000'
  const seqN = parseInt(seq, 10) || 0
  let vh = 0
  const v = String(t.venue || '')
  for (let i = 0; i < v.length; i++) vh = (vh + v.charCodeAt(i)) | 0
  const w = parseWhen(t.date)
  return {
    vip,
    when: w,
    gateNo: String(2 + (Math.abs(vh) % 28)),
    no: 1000 + (Math.abs(vh) % 9000) + '-' + (1000 + (Math.abs(seqN * 31) % 9000)) + '-' + (10 + (seqN % 90)),
  }
}

function to12h(s: string) {
  const m = /(\d{1,2}):(\d{2})/.exec(s || '')
  if (!m) return s || ''
  let h = +m[1]!
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return h + ':' + m[2] + ' ' + ap
}

const MONTHS: Record<string, string> = {
  JAN: 'JANUARY',
  FEB: 'FEBRUARY',
  MAR: 'MARCH',
  APR: 'APRIL',
  MAY: 'MAY',
  JUN: 'JUNE',
  JUL: 'JULY',
  AUG: 'AUGUST',
  SEP: 'SEPTEMBER',
  OCT: 'OCTOBER',
  NOV: 'NOVEMBER',
  DEC: 'DECEMBER',
}

function ordinal(n: number | string) {
  const x = parseInt(String(n), 10) || 0
  const s = ['TH', 'ST', 'ND', 'RD']
  const v = x % 100
  return x + (s[(v - 20) % 10] || s[v] || s[0]!)
}

function daisy(ctx: Ctx, cx: number, cy: number, r: number, petal: string, center: string) {
  ctx.fillStyle = petal
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.62, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = center
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2)
  ctx.fill()
}

/** retro concentric-ring corner blob (drawn while card is clipped) */
function funkCorner(ctx: Ctx, cx: number, cy: number, base: number, cols: string[]) {
  for (let i = cols.length - 1; i >= 0; i--) {
    ctx.fillStyle = cols[i]!
    ctx.beginPath()
    ctx.arc(cx, cy, base * (0.42 + i * 0.34), 0, Math.PI * 2)
    ctx.fill()
  }
}

/* Eventa logo mark (assets/img/logo.svg, viewBox 1332×729) drawn via path so it can be recoloured */
const LOGO_PATH =
  'M275.605 49.9045C311.006 13.3051 359.936 -3.16751 407.512 0.501198H851.159C978.946 0.501307 1058.81 138.835 994.919 249.501L773.252 633.438C762.811 655.169 747.748 674.624 729.019 690.142C694.393 719.195 650.05 731.743 607.03 727.789L166.412 728.226C38.6249 728.352 -41.3783 590.097 22.4058 479.367L245.593 91.9104C253.367 76.4996 263.488 62.2943 275.605 49.9045Z'

function drawLogo(ctx: Ctx, x: number, y: number, w: number, color: string) {
  const s = w / 1332
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.fillStyle = color
  ctx.fill(new Path2D(LOGO_PATH))
  ctx.beginPath()
  ctx.arc(1159.38, 556.359, 172, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** brand lockup: logo mark + "Eventa" wordmark, laid out horizontally and centred on cx */
function drawLockup(ctx: Ctx, cx: number, y: number, markW: number, color: string) {
  const markH = markW * (729 / 1332)
  const fs = Math.round(markH * 1.05)
  const gap = 12
  ctx.font = '800 ' + fs + 'px Inter, sans-serif'
  const tw2 = ctx.measureText('Eventa').width
  const startX = cx - (markW + gap + tw2) / 2
  drawLogo(ctx, startX, y, markW, color)
  txt(
    ctx,
    'Eventa',
    startX + markW + gap,
    y + markH * 0.5 + fs * 0.36,
    '800 ' + fs + 'px Inter, sans-serif',
    color,
    'left',
    -0.2,
  )
}

/** Downloadable ticket — vibrant retro-funk concert stub. QR lives in the right stub. */
export function buildFlyer(t: FlyerTicket): HTMLCanvasElement {
  const S = 2
  const W = 1180
  const H = 480
  const M = 13
  const R = 22
  const d = derive(t)
  const w = d.when
  const PUR = '#1ba770'
  const NAVY = '#0a3325'
  const WHITE = '#ffffff'
  const AMBER = '#f6b93b'
  const DEEPG = '#0e8a5b'
  const PALE = '#cdf5e4'
  const cv = document.createElement('canvas')
  cv.width = W * S
  cv.height = H * S
  const ctx = cv.getContext('2d')!
  ctx.scale(S, S)
  ctx.textBaseline = 'alphabetic'
  const TN = '"Titan One", Inter, sans-serif'

  const tx = M
  const ty = M
  const tw = W - M * 2
  const th = H - M * 2
  const px = tx + 878

  /* ---- purple card base ---- */
  ctx.save()
  roundRect(ctx, tx, ty, tw, th, R)
  ctx.clip()
  ctx.fillStyle = PUR
  ctx.fillRect(tx, ty, tw, th)

  /* subtle wavy pattern */
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 22
  for (let wv = 0; wv < 4; wv++) {
    ctx.beginPath()
    for (let xx = tx; xx <= tx + tw; xx += 16) {
      const yy = ty + 70 + wv * 120 + Math.sin(xx / 120 + wv) * 26
      if (xx === tx) ctx.moveTo(xx, yy)
      else ctx.lineTo(xx, yy)
    }
    ctx.stroke()
  }

  /* funk corner blobs */
  funkCorner(ctx, tx + 44, ty + 22, 118, [AMBER, DEEPG, PALE])
  funkCorner(ctx, tx + tw - 26, ty + 6, 120, [PALE, AMBER, DEEPG])
  funkCorner(ctx, tx + 8, ty + th - 6, 84, [AMBER, PALE, DEEPG])

  /* ===== TITLE — event name, stacked bubble words ===== */
  let words = String(t.event || 'EVENT')
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length > 4) words = words.slice(0, 3).concat([words.slice(3).join(' ')])
  const maxW = 360
  let fs = Math.floor(Math.min(72, 250 / words.length) * 0.92)
  const widest = () => {
    let m = 0
    for (let i = 0; i < words.length; i++) m = Math.max(m, ctx.measureText(words[i]!).width)
    return m
  }
  ctx.font = fs + 'px ' + TN
  while (widest() > maxW && fs > 26) {
    fs -= 2
    ctx.font = fs + 'px ' + TN
  }
  const lh = fs
  const tX = 48
  const tBase = ty + 40 + fs
  ctx.textAlign = 'left'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  for (let li = 0; li < words.length; li++) {
    const yb = tBase + li * lh
    ctx.font = fs + 'px ' + TN
    ctx.lineWidth = fs * 0.18
    ctx.strokeStyle = NAVY
    ctx.strokeText(words[li]!, tX, yb)
    ctx.fillStyle = WHITE
    ctx.fillText(words[li]!, tX, yb)
  }
  /* sub tagline with daisies */
  const subY = tBase + (words.length - 1) * lh + 36
  const subT = d.vip ? 'vip experience' : 'live concert'
  ctx.font = '800 20px Inter, sans-serif'
  const subW = ctx.measureText(subT).width
  daisy(ctx, tX + 8, subY - 6, 8, AMBER, NAVY)
  txt(ctx, subT, tX + 26, subY, '800 20px Inter, sans-serif', NAVY, 'left', 0.3)
  daisy(ctx, tX + 26 + subW + 16, subY - 6, 8, AMBER, NAVY)

  /* ===== MIDDLE column ===== */
  const mX = 452
  const dateStr = (MONTHS[w.mon] || w.mon || 'AUGUST') + ' ' + ordinal(w.day || 20) + ', ' + (w.year || '2026')
  txt(ctx, dateStr, mX, ty + 96, '800 20px Inter, sans-serif', NAVY, 'left', 0.3)
  ctx.font = '700 14px Inter, sans-serif'
  ctx.fillStyle = NAVY
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0.4px'
  wrapText(ctx, ('At ' + (t.venue || 'Anywhere Stadium')).toUpperCase(), mX, ty + 132, 250, 22)
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
  txt(ctx, 'DOORS OPEN AT:', mX, ty + 200, '700 14px Inter, sans-serif', NAVY, 'left', 0.6)
  txt(ctx, to12h(w.doors || w.time) || '6:00 PM', mX + 140, ty + 204, '400 26px ' + TN, NAVY, 'left')

  /* ROW / SEAT / GATE box */
  const boxX = mX
  const boxY = ty + 232
  const boxW = 300
  const boxH = 96
  ctx.strokeStyle = NAVY
  ctx.lineWidth = 2
  roundRect(ctx, boxX, boxY, boxW, boxH, 12)
  ctx.stroke()
  const gate = String.fromCharCode(65 + ((parseInt(d.gateNo, 10) || 0) % 6))
  const rowV = d.vip ? String(1 + ((parseInt(d.no, 10) || 4) % 20)) : 'GA'
  const seatV = d.vip ? rowV + 'D' : 'GA'
  const cols3: [string, string][] = [
    ['ROW', rowV],
    ['SEAT', seatV],
    ['GATE', gate],
  ]
  for (let c = 0; c < 3; c++) {
    const ccx = boxX + (boxW * (c + 0.5)) / 3
    if (c > 0) {
      ctx.strokeStyle = 'rgba(10,51,37,0.32)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(boxX + (boxW * c) / 3, boxY + 14)
      ctx.lineTo(boxX + (boxW * c) / 3, boxY + boxH - 14)
      ctx.stroke()
    }
    txt(ctx, cols3[c]![0], ccx, boxY + 34, '700 12px Inter, sans-serif', 'rgba(10,51,37,0.72)', 'center', 1)
    txt(ctx, cols3[c]![1], ccx, boxY + 74, '400 28px ' + TN, NAVY, 'center')
  }

  /* amber PASS/tier badge */
  const bcx = mX + 344
  const bcy = ty + 74
  const br = 46
  const badgeTier = d.vip ? 'VIP' : 'GA'
  ctx.fillStyle = AMBER
  ctx.beginPath()
  ctx.arc(bcx, bcy, br, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = NAVY
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(bcx, bcy, br, 0, Math.PI * 2)
  ctx.stroke()
  txt(ctx, 'CLASS', bcx, bcy - 9, '800 12px Inter, sans-serif', 'rgba(10,51,37,0.72)', 'center', 1.4)
  txt(ctx, badgeTier, bcx, bcy + 23, '400 30px ' + TN, NAVY, 'center')

  /* Eventa brand lockup — footer, centred under the seat box */
  drawLockup(ctx, 602, ty + 372, 44, WHITE)

  /* ===== PERFORATION ===== */
  ctx.strokeStyle = NAVY
  ctx.lineWidth = 2.5
  ctx.setLineDash([3, 9])
  ctx.beginPath()
  ctx.moveTo(px, ty + 12)
  ctx.lineTo(px, ty + th - 12)
  ctx.stroke()
  ctx.setLineDash([])

  /* ===== STUB (QR) ===== */
  const sMid = (px + tx + tw) / 2
  const boxSize = 176
  const sqx = sMid - boxSize / 2
  const sqy = ty + 54
  ctx.fillStyle = WHITE
  roundRect(ctx, sqx, sqy, boxSize, boxSize + 40, 16)
  ctx.fill()
  const QS = 148
  const qx = sMid - QS / 2
  const qy = sqy + 16
  drawQR(ctx, makeQR(t.payload), qx, qy, QS, NAVY, '#ffffff')
  txt(ctx, 'ADMIT ONE', sMid, sqy + boxSize + 24, '800 15px Inter, sans-serif', NAVY, 'center', 1.5)
  txt(ctx, 'ADMISSION NO.', sMid, sqy + boxSize + 82, '700 11px Inter, sans-serif', NAVY, 'center', 1)
  txt(ctx, d.no, sMid, sqy + boxSize + 106, '800 15px Inter, sans-serif', NAVY, 'center', 1)

  ctx.restore() /* unclip */

  /* navy card border */
  ctx.strokeStyle = NAVY
  ctx.lineWidth = 5
  roundRect(ctx, tx + 2.5, ty + 2.5, tw - 5, th - 5, R - 2)
  ctx.stroke()

  /* transparent notches + scalloped right edge */
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(px, ty, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(px, ty + th, 12, 0, Math.PI * 2)
  ctx.fill()
  for (let sy = ty + 22; sy < ty + th - 8; sy += 30) {
    ctx.beginPath()
    ctx.arc(tx + tw, sy, 9, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  return cv
}
