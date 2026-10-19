import { rowTypeOf, type RowTicketTypes as Rows, type TicketTypeChoice } from '../eventSeating.mapper'

/**
 * "Ticket types by row" on the wizard's Assign seats step (US-EVT-05): one
 * select per seat row, numbered as the API numbers them. A row can only be
 * given a ticket type the API has stored, so the step shows this only once
 * there are some, and says where to make them until then.
 */
export function RowTicketTypes({
  rows,
  choices,
  onPick,
}: {
  /** One entry per row, index 0 = row 1. */
  rows: Rows
  choices: TicketTypeChoice[]
  onPick: (row: number, ticketTypeId: string | null) => void
}) {
  return (
    <div className="rounded-xl border border-hair bg-canvas p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Ticket types by row
      </p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((ticketTypeId, row) => (
          <div key={row} className="flex items-center gap-3">
            <label htmlFor={`row-type-${row}`} className="label mb-0 w-14 shrink-0 tnum">
              Row {row + 1}
            </label>
            <select
              id={`row-type-${row}`}
              className="select"
              value={ticketTypeId ?? ''}
              onChange={(e) => onPick(row, rowTypeOf(e.target.value))}
            >
              <option value="">No ticket type</option>
              {choices.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
