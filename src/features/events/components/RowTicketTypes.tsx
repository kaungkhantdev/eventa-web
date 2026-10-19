import {
  MIXED_ROW,
  rowChoiceOf,
  typeOfChoice,
  type SeatTicketTypes,
  type TicketTypeChoice,
} from '../eventSeating.mapper'

/**
 * "Ticket types by row" on the wizard's Assign seats step (US-EVT-05): one
 * select per seat row, numbered as the API numbers them — the quick way to
 * give a whole row one type. A row whose seats were given different types on
 * the map reads "Mixed" until a type is picked for all of it. A seat can only
 * be given a ticket type the API has stored, so the step shows this only once
 * there are some, and says where to make them until then.
 */
export function RowTicketTypes({
  rows,
  choices,
  onPick,
}: {
  /** Each seat's type, `[row][seat]`, index 0 = row 1. */
  rows: SeatTicketTypes
  choices: TicketTypeChoice[]
  onPick: (row: number, ticketTypeId: string | null) => void
}) {
  return (
    <div className="rounded-xl border border-hair bg-canvas p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Ticket types by row
      </p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((seats, row) => {
          const value = rowChoiceOf(seats)
          return (
            <div key={row} className="flex items-center gap-3">
              <label htmlFor={`row-type-${row}`} className="label mb-0 w-14 shrink-0 tnum">
                Row {row + 1}
              </label>
              <select
                id={`row-type-${row}`}
                className="select"
                value={value}
                onChange={(e) => onPick(row, typeOfChoice(e.target.value))}
              >
                {value === MIXED_ROW && (
                  <option value={MIXED_ROW} disabled>
                    Mixed
                  </option>
                )}
                <option value="">No ticket type</option>
                {choices.map((choice) => (
                  <option key={choice.id} value={choice.id}>
                    {choice.name}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
