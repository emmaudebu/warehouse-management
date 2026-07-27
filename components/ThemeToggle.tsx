'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('fwms-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (stored === 'dark') {
      setIsDark(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark ? 'dark' : 'light'
    setIsDark(!isDark)
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('fwms-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('fwms-theme', 'light')
    }
  }

  // Prevent hydration mismatch flash
  if (!mounted) {
    return <button className="btn" style={{ width: '40px', height: '40px', padding: 0 }} />
  }

  return (
    <button onClick={toggleTheme} className="btn hover-scale" style={{ 
      backgroundColor: 'var(--bg-darker)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      padding: 0
    }} aria-label="Toggle theme">
      {isDark ? '🌙' : '☀️'}
    </button>
  )
}
