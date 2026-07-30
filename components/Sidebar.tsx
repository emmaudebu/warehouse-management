'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Footer from './Footer'
import { useState, useEffect } from 'react'
import { useMobileMenu } from './MobileMenuContext'

export default function Sidebar({ role }: { role?: string }) {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const { isMobileSidebarOpen, closeMobileSidebar } = useMobileMenu()
  const isProfile = pathname === '/profile'
  const isActivities = pathname === '/activities'

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isOpen ? '240px' : '70px')
  }, [isOpen])

  return (
    <>
      <div 
        className={`mobile-sidebar-overlay ${isMobileSidebarOpen ? 'open' : ''}`}
        onClick={closeMobileSidebar}
      />
      <aside className={`desktop-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`} style={{
        width: 'var(--sidebar-width)',
      backgroundColor: 'var(--bg-card)',
      borderRight: '1px solid var(--border-color)',
      height: '100%',
      position: 'relative',
      padding: '1.5rem 0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      overflow: 'hidden',
      zIndex: 20
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isOpen ? 'space-between' : 'center',
        marginBottom: '1rem',
        padding: '0 0.5rem'
      }}>
        {isOpen && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Dashboard
          </div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.25rem',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Toggle Sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.3s' }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {(isProfile || isActivities) ? (
        <>
           <SidebarLink href="/dashboard" label="Back to Dashboard" icon="⬅️" isOpen={isOpen} onClick={closeMobileSidebar} />
           <SidebarLink href="/activities" label="Activity Logs" icon="📜" isOpen={isOpen} onClick={closeMobileSidebar} />
        </>
      ) : (
        <>
          {role !== 'SALESPERSON' && (
            <>
              <SidebarLink href="#overview" label="Overview" icon="📊" isOpen={isOpen} onClick={closeMobileSidebar} />
              <SidebarLink href="#inventory" label="Inventory" icon="📦" isOpen={isOpen} onClick={closeMobileSidebar} />
              <SidebarLink href="#actions" label="Actions" icon="⚡" isOpen={isOpen} onClick={closeMobileSidebar} />
            </>
          )}

          {role === 'SALESPERSON' && (
            <>
              <SidebarLink href="/salesperson" label="Sales Dashboard" icon="🛒" isOpen={isOpen} onClick={closeMobileSidebar} />
              <SidebarLink href="/salesperson/history" label="My Sales Ledger" icon="🧾" isOpen={isOpen} onClick={closeMobileSidebar} />
            </>
          )}
          <SidebarLink href="/activities" label="Activity Logs" icon="📜" isOpen={isOpen} onClick={closeMobileSidebar} />
          
          {role === 'DIRECTOR' && (
            <>
              {isOpen ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.5rem', marginTop: '1rem' }}>
                  Administration
                </div>
              ) : (
                <div style={{ borderTop: '1px solid var(--border-color)', margin: '1rem 0 0.5rem' }}></div>
              )}
              <SidebarLink href="/director/admin" label="Control Panel" icon="⚙️" isOpen={isOpen} onClick={closeMobileSidebar} />
            </>
          )}
        </>
      )}
      
      <div style={{ marginTop: 'auto' }}>
        {isOpen && <Footer />}
      </div>
    </aside>
    </>
  )
}

function SidebarLink({ href, label, icon, isOpen, onClick }: { href: string, label: string, icon: string, isOpen: boolean, onClick?: () => void }) {
  const pathname = usePathname()
  
  // Resolve base path (e.g., "/director/admin" -> "/director")
  const basePath = pathname ? `/${pathname.split('/')[1]}` : ''
  const isHash = href.startsWith('#')
  const finalHref = isHash ? `${basePath}${href}` : href

  return (
    <Link href={finalHref} onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      color: 'var(--text-light)',
      textDecoration: 'none',
      transition: 'all 0.2s',
      fontSize: '1.05rem',
      fontWeight: 500,
      justifyContent: isOpen ? 'flex-start' : 'center'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--bg-dark)'
      e.currentTarget.style.color = 'var(--primary-color)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
      e.currentTarget.style.color = 'var(--text-light)'
    }}
    title={!isOpen ? label : undefined}
    >
      <span style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center' }}>{icon}</span>
      {isOpen && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
    </Link>
  )
}
