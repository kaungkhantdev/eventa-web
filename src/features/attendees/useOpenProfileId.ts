import { useLocation, useNavigation, useSearchParams } from 'react-router'
import { profileIdOf } from './directory.routes'

/**
 * Whose profile panel the directory has open.
 *
 * Read off the URL being navigated *to* while a navigation to this same page is
 * in flight, and off the committed URL otherwise. That is what opens the panel
 * on the click rather than when the history arrives: everything the panel shows
 * about the person — name, email, phone, tag — came with the directory row, so
 * there is nothing to wait for, and the timeline carries its own loading state
 * inside the open panel.
 *
 * Only a same-page navigation is read. A move to another route is the shell's
 * business — it swaps the whole page for a skeleton — and reading that URL's
 * parameters here would be reading somebody else's query string.
 */
export function useOpenProfileId(): number | null {
  const [params] = useSearchParams()
  const navigation = useNavigation()
  const location = useLocation()
  const pending = navigation.location

  const target =
    pending && pending.pathname === location.pathname
      ? new URLSearchParams(pending.search)
      : params

  return profileIdOf(target)
}
