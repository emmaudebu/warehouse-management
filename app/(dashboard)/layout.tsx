import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

import ChatWidget from '@/components/ChatWidget'
import { MobileMenuProvider } from '@/components/MobileMenuContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { status: true } })

  if (!dbUser || dbUser.status === 'SUSPENDED') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-light)', padding: '2rem', textAlign: 'center' }}>
        <div style={{ backgroundColor: 'var(--bg-dark)', padding: '3rem', borderRadius: '1rem', border: '1px solid var(--border-color)', maxWidth: '500px' }}>
          <h1 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>Hello {session.user.name}</h1>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.5', color: 'var(--text-muted)' }}>Sorry, you have been suspended from doing any supply for now.</p>
          <form action={async () => {
            'use server'
            await signOut()
          }}>
            <button className="btn btn-primary" style={{ marginTop: '2rem', padding: '1rem 2rem', fontSize: '1.1rem' }}>Log Out</button>
          </form>
        </div>
      </div>
    )
  }

  const role = session.user.role
  const announcement = await prisma.announcement.findFirst({ where: { isActive: true }, include: { author: true } })

  return (
    <MobileMenuProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Navbar />
        
        {announcement && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', flexShrink: 0, zIndex: 5, position: 'relative' }}>
          <div className="animate-fade-in" style={{
            backgroundColor: announcement.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${announcement.priority === 'HIGH' ? 'var(--danger-color)' : 'var(--primary-color)'}`,
            borderRadius: '999px',
            color: 'var(--text-light)',
            padding: '0.75rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxWidth: '90%',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '1.25rem' }}>📢</span>
            <p style={{ margin: 0, fontWeight: 500, fontSize: '0.95rem' }}>{announcement.message}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar role={role} />
        <main className="dashboard-scroll" style={{ 
          flex: 1, 
          padding: '2rem', 
          backgroundColor: 'var(--bg-dark)', 
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth'
        }}>
          {children}
        </main>
      </div>

        <ChatWidget currentUserId={session.user.id} />
      </div>
    </MobileMenuProvider>
  )
}
