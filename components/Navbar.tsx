import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import NotificationIcon from './NotificationIcon'
import UserMenu from './UserMenu'
import MobileMenuToggle from './MobileMenuToggle'
import { auth } from '@/auth'
import { getSystemSettings } from '@/app/actions/settings'
import prisma from '@/lib/prisma'

export default async function Navbar() {
  const session = await auth()
  const sysSettings = await getSystemSettings()
  const compSettings = await prisma.companySettings.findFirst()

  const logoUrl = sysSettings?.logoUrl || compSettings?.logoUrl
  const companyName = compSettings?.name || 'FWMS'

  return (
    <nav className="navbar-mobile" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 2rem',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 60
    }}>
      <div style={{ display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '1.25rem', color: 'var(--text-light)' }}>
        <MobileMenuToggle />
        {logoUrl ? (
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logoUrl} alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
          </Link>
        ) : (
          <Link href="/" className="text-gradient">{companyName}</Link>
        )}
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <NotificationIcon />
        <ThemeToggle />
        {session?.user ? (
          <UserMenu user={session.user} />
        ) : (
          <Link href="/login" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>Login</Link>
        )}
      </div>
    </nav>
  )
}
