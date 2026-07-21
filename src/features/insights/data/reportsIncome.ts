/* Income-by-event rows for the Reports · Income sub-page. Derived from the
   shared REPORTS_EVENTS list exactly as the static kit did in
   admin/reports-income.html: refunds = 2.7% of gross, fees = 2.9% of gross,
   net = gross − refunds − fees. Mock data. */

import { REPORTS_EVENTS } from './reportsEvents'

export type IncomeRow = {
  name: string
  meta: string
  gross: number
  refunds: number
  fees: number
  net: number
}

export const INCOME_ROWS: IncomeRow[] = REPORTS_EVENTS.map((e) => {
  const gross = e.rev
  const refunds = Math.round(e.rev * 0.027)
  const fees = Math.round(e.rev * 0.029)
  return { name: e.name, meta: e.meta, gross, refunds, fees, net: gross - refunds - fees }
})
