// input: localStorage, prefers-color-scheme media query
// output: { themeMode, isDark, cycleTheme } — reactive theme state
// pos: shared hook consumed by App.jsx for light/dark auto-switching

import { useState, useEffect } from 'react'

const THEME_KEY = 'ai-speed-test-theme'

export function useTheme() {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem(THEME_KEY) || 'auto')
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const isDark = themeMode === 'auto' ? systemDark : themeMode === 'dark'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const cycleTheme = () => {
    const next = themeMode === 'auto' ? 'light' : themeMode === 'light' ? 'dark' : 'auto'
    setThemeMode(next)
    localStorage.setItem(THEME_KEY, next)
  }

  const themeLabel = themeMode === 'auto' ? '跟随系统' : themeMode === 'light' ? '浅色模式' : '深色模式'
  const themeIcon = themeMode === 'auto' ? '🖥️' : isDark ? '🌙' : '☀️'

  return { themeMode, isDark, cycleTheme, themeLabel, themeIcon }
}
