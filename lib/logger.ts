import prisma from './prisma'

export async function logActivity(userId: string, action: string, details?: string, warehouseId?: string) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details,
        warehouseId
      }
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}
