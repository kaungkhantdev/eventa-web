import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { router } from './routes'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      {/* Outside the router on purpose: a toast raised by an action has to
          outlive the navigation that action triggers, and RootLayout swaps the
          entire screen for a skeleton while one is in flight.

          The cards are ours (`toast.custom`), so there is no theme prop here —
          semantic tokens flip with the `dark` class by themselves, and the
          sizing lives on the card because sonner leaves a custom toast
          unstyled. */}
      <Toaster position="top-right" expand/>
    </>
  )
}
