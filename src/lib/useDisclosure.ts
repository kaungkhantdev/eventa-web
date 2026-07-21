import { useCallback, useState } from 'react'

/** Open/close state for slide-over panels and modals. Replaces the static
 *  kit's declarative `data-open` / `data-close` wiring in shell.js. */
export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial)
  return {
    open,
    setOpen,
    onOpen: useCallback(() => setOpen(true), []),
    onClose: useCallback(() => setOpen(false), []),
    onToggle: useCallback(() => setOpen((o) => !o), []),
  }
}
