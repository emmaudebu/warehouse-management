'use client'
import React from 'react'
import { useMobileMenu } from './MobileMenuContext'

export default function MobileMenuToggle() {
  const { toggleMobileSidebar } = useMobileMenu()

  return (
    <button 
      onClick={toggleMobileSidebar}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--text-light)',
        cursor: 'pointer',
        alignItems: 'center',
        padding: '0.5rem',
        marginRight: '0.5rem'
      }}
      className="mobile-only-toggle"
      aria-label="Toggle menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  )
}
