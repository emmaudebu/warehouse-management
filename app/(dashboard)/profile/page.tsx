import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import ProfileForm from '@/components/ProfileForm'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'My Profile | Dashboard'
}

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      username: true,
      role: true,
      warehouse: { select: { name: true } }
    }
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.5rem' }}>Account Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your personal information and security settings.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 500px' }}>
          <ProfileForm user={user} />
        </div>
        
        <div className="card" style={{ flex: '1 1 300px', backgroundColor: 'var(--bg-card)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-light)', fontSize: '1.1rem' }}>Account Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Role</span>
              <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>{user.role.replace('_', ' ')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Assigned Location</span>
              <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>{user.warehouse?.name || 'Network Wide'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status</span>
              <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
