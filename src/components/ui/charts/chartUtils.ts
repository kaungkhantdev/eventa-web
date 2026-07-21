/* Shared chart helpers ------------------------------------------------------------
   Ported verbatim from the static kit's chart maths (assets/reports-chart.js and the
   inline revenue charts in admin/dashboard.html + admin/reports.html) so every chart
   in the React kit reads as one family: the same Catmull-Rom curve, the same axis
   formatting, the same zero-based / fitted y-domain.

   Colours are expressed as CSS token references (never raw hex) so the charts flip
   with the theme automatically — no JS theme detection, no re-render on toggle:

     brand  #1ba770         the one accent, identical in both themes
     grid   rgb(var(--line))   the hairline token  (#eef0f3 light)
     axis   rgb(var(--muted))  the muted label token (#8b93a4 light)
     ring   rgb(var(--surface)) card colour, so the dot's halo reads as a cut-out
     tipBg  rgb(var(--ink))     the tooltip pill inverts against the surface
     tipFg  rgb(var(--surface))                                                   */

export type Point = [number, number]

export const chartColors = {
  brand: 'var(--color-brand)',
  grid: 'rgb(var(--line))',
  axis: 'rgb(var(--muted))',
  ring: 'rgb(var(--surface))',
  tipBg: 'rgb(var(--ink))',
  tipFg: 'rgb(var(--surface))',
} as const

/** Soft gradient stop opacity for area fills — matches the revenue chart (0.28 → 0). */
export const AREA_FILL_TOP_OPACITY = 0.28

export type Formatting = {
  /** Unit prefix, e.g. '฿'. */
  prefix?: string
  /** Unit suffix, e.g. 'k' or '%'. */
  suffix?: string
  /** Full override — wins over prefix/suffix when supplied. */
  format?: (value: number) => string
}

/** Axis + tooltip label: prefix + value (rounded to 1 dp) + suffix, or the override. */
export function formatValue(value: number, f: Formatting): string {
  if (f.format) return f.format(value)
  const rounded = Math.round(value * 10) / 10
  return `${f.prefix ?? ''}${rounded}${f.suffix ?? ''}`
}

export type Domain = { lo: number; hi: number }

/** The y-axis span. Zero-based to `max` (or 1.15× the peak) by default; `fit` snugs
 *  the axis to the data band instead — essential for rates that live in a narrow
 *  window (an attendance 76–82% band reads flat on a 0–100 axis). */
export function computeDomain(
  values: number[],
  opts: { fit?: boolean; max?: number; suffix?: string },
): Domain {
  if (!opts.fit) {
    let hi: number
    if (opts.max != null) hi = opts.max
    else hi = (values.length ? Math.max(...values) * 1.15 : 1) || 1
    return { lo: 0, hi }
  }
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pad = Math.max(1, (hi - lo) * 0.35)
  let yLo = Math.floor(lo - pad)
  let yHi = Math.ceil(hi + pad)
  if (opts.suffix === '%') {
    yLo = Math.max(0, yLo)
    yHi = Math.min(100, yHi)
  }
  if (yHi <= yLo) yHi = yLo + 1
  return { lo: yLo, hi: yHi }
}

/** Catmull-Rom → cubic bezier. The one curve treatment shared by every line/area
 *  chart in the kit, ported unchanged from the static sources. */
export function smoothPath(pts: Point[]): string {
  if (pts.length === 0) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`
  }
  return d
}
