import { useEffect, useState } from 'react'

/** One theme for the whole product: the public site and the desk share it. */
export type Theme = 'light' | 'dark'

export const THEME_KEY = 'jp.desk.theme'
const EVENT = 'jp:theme'

function read(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage blocked — fall through to the default */
  }
  return 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  // Keep every mounted toggle in step (site nav, desk top bar).
  useEffect(() => {
    const sync = (e: Event) => setTheme((e as CustomEvent<Theme>).detail)
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    window.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: next }))
  }

  return { theme, toggle }
}
