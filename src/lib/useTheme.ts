import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'chipsense.theme'

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}

/** Follows the OS until the user picks a side; the choice is then remembered. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => storedTheme() ?? systemTheme())

  useEffect(() => {
    if (storedTheme()) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setTheme(systemTheme())
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      try {
        localStorage.setItem(KEY, next)
      } catch {
        /* private mode: the choice lasts for this page only */
      }
      return next
    })
  }, [])

  return { theme, toggle }
}
