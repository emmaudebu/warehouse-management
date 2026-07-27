import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import NotificationBell from './NotificationBell'

export default async function NotificationIcon() {
  const session = await auth()
  if (!session?.user) return null

  let count = 0

  try {
    if (session.user.role === 'DIRECTOR') {
      const pendingTransfers = await prisma.transfer.count({ where: { status: 'PENDING' } })
      count = pendingTransfers
    } else if (session.user.warehouseId) {
      const pendingTransfers = await prisma.transfer.count({ 
        where: { 
          destinationId: session.user.warehouseId, 
          status: 'PENDING' 
        } 
      })
      count = pendingTransfers
    }
  } catch (err) {
    console.error('Failed to fetch notifications count:', err)
  }

  return <NotificationBell initialCount={count} />
}
