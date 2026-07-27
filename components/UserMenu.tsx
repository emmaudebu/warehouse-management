'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

export default function UserMenu({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'transparent',
          border: '1px solid var(--border-color)',
          padding: '0.4rem 0.75rem',
          borderRadius: '2rem',
          cursor: 'pointer',
          color: 'var(--text-light)',
          transition: 'all 0.2s',
          backgroundColor: isOpen ? 'var(--bg-darker)' : 'transparent'
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-color)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '1rem'
        }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role.replace('_', ' ')}</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '0.25rem' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="animate-fade-in" style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.75rem',
          boxShadow: 'var(--glass-shadow)',
          minWidth: '200px',
          overflow: 'hidden',
          zIndex: 50
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-light)' }}>{user.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
          
          <div style={{ padding: '0.5rem' }}>
            <Link 
              href="/profile" 
              onClick={() => setIsOpen(false)}
              style={{
                display: 'block',
                padding: '0.75rem 1rem',
                color: 'var(--text-light)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                borderRadius: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-darker)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              My Profile
            </Link>
          </div>
          
          <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => {
                const origin = window.location.origin || 'http://127.0.0.1:3002';
                signOut({ callbackUrl: `${origin}/login` });
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.75rem 1rem',
                color: 'var(--danger-color)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                borderRadius: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
