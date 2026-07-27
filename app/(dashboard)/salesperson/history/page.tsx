import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import TransferHistory from '@/components/TransferHistory'

export default async function SalespersonHistory() {
  const session = await auth()
  if (session?.user?.role !== 'SALESPERSON') {
    redirect('/')
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      <header>
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>My Sales Ledger</h1>
        <p style={{ color: 'var(--text-muted)' }}>History of all supplies and sales initiated by you.</p>
      </header>

      <TransferHistory userId={session.user.id} hideActions={true} />
    </div>
  )
}
