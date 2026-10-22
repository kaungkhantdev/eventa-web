import { useState } from 'react'
import { useFetcher } from 'react-router'
import type { Panel } from '@/app/panels'
import { useDisclosure } from '@/lib/useDisclosure'
import { passOnShow } from '../myEvents.mapper'
import { ticketPassPath } from '../myEvents.routes'
import type { MyEventRow, TicketPass } from '../myEvents.types'

/** What the modal needs to show whichever ticket is open. */
export interface TicketModalState {
  open: boolean
  onClose: () => void
  event: MyEventRow | null
  ticketId: string | null
  show: (ticketId: string) => void
  /** The loaded pass, or why it would not load; absent while loading. */
  pass: Panel<TicketPass> | null
}

/**
 * Opens the modal on a registration's first ticket, and switches between its
 * tickets. Each switch fetches that ticket's own pass.
 */
export function useTicketModal() {
  const disclosure = useDisclosure()
  const fetcher = useFetcher<Panel<TicketPass>>()
  const [event, setEvent] = useState<MyEventRow | null>(null)
  const [ticketId, setTicketId] = useState<string | null>(null)

  const show = (id: string) => {
    setTicketId(id)
    void fetcher.load(ticketPassPath(id))
  }

  const openFor = (ev: MyEventRow) => {
    setEvent(ev)
    setTicketId(null)
    disclosure.onOpen()
    const first = ev.ticketIds[0]
    if (first) show(first)
  }

  // Only the pass that was asked for: while the next one loads, the last
  // one's QR must not stand in for it.
  const loaded = fetcher.state === 'idle' ? (fetcher.data ?? null) : null
  const state: TicketModalState = {
    open: disclosure.open,
    onClose: disclosure.onClose,
    event,
    ticketId,
    show,
    pass: passOnShow(ticketId, loaded),
  }
  return { openFor, state }
}
