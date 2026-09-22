import { useCallback, useState } from 'react'

/**
 * A modal that acts on one row of a list.
 *
 * The row is kept after closing so the dialog still reads correctly while it
 * fades out, and `session` counts openings: a fetcher keyed by it starts
 * afresh each time, so yesterday's refusal never greets the next row.
 */
export interface RowDialog<T> {
  row: T | null
  open: boolean
  session: number
  show: (row: T) => void
  hide: () => void
}

export function useRowDialog<T>(): RowDialog<T> {
  const [row, setRow] = useState<T | null>(null)
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState(0)

  const show = useCallback((next: T) => {
    setRow(next)
    setSession((n) => n + 1)
    setOpen(true)
  }, [])

  return { row, open, session, show, hide: useCallback(() => setOpen(false), []) }
}
