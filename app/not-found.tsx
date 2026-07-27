'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-dark)',
      padding: '2rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decor */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(252, 163, 17, 0.05) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="text-gradient" style={{
          fontSize: '8rem',
          fontWeight: 900,
          lineHeight: 1,
          marginBottom: '1rem',
          textShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          404
        </h1>
        
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--text-light)',
          marginBottom: '1rem'
        }}>
          Pallet Not Found
        </h2>
        
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-muted)',
          maxWidth: '400px',
          marginBottom: '2.5rem',
          lineHeight: 1.6
        }}>
          It looks like the page you are looking for has been misplaced in the warehouse. Let's get you back to familiar territory.
        </p>

        <Link href="/" className="btn" style={{
          padding: '0.8rem 2rem',
          fontSize: '1.1rem',
          borderRadius: '2rem',
          background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)',
          color: 'white',
          textDecoration: 'none',
          fontWeight: 600,
          boxShadow: '0 8px 25px rgba(252, 163, 17, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(252, 163, 17, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(252, 163, 17, 0.4)'
        }}
        >
          Return to Dashboard
        </Link>
      </div>

      {/* Subtle Illustration overlay */}
      <svg style={{ position: 'absolute', bottom: '-5%', right: '-5%', opacity: 0.03, width: '50vw', height: '50vw', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 16.5C21 16.88 20.79 17.21 20.47 17.38L12.5 21.82C12.19 21.99 11.81 21.99 11.5 21.82L3.53 17.38C3.21 17.21 3 16.88 3 16.5V7.5C3 7.12 3.21 6.79 3.53 6.62L11.5 2.18C11.81 2.01 12.19 2.01 12.5 2.18L20.47 6.62C20.79 6.79 21 7.12 21 7.5V16.5ZM12 4.15L5 8V16L12 19.85L19 16V8L12 4.15Z" />
      </svg>
    </div>
  )
}
