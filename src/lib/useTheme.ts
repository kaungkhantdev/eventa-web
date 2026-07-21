import { useCallback, useEffect, useState } from 'react'

const THEME_KEY = 'eventa-theme'

function isDark() {
  return document.documentElement.classList.contains('dark')
}

/** Dark mode, matching the static kit: a `dark` class on <html> plus a
 *  localStorage entry. index.html applies the stored value before paint, so
 *  this hook only has to keep React in sync and handle toggling. */
export function useTheme() {
  const [dark, setDark] = useState(isDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    } catch {
      /* private mode — the class still applied, just not persisted */
    }
  }, [dark])

  const toggle = useCallback(() => setDark((d) => !d), [])

  return { dark, toggle }
}
