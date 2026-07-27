'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export async function addAnnouncement(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'DIRECTOR') throw new Error('Unauthorized')

  const message = formData.get('message') as string
  const priority = formData.get('priority') as string

  // Deactivate all old announcements so only the latest is active
  await prisma.announcement.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  })

  await prisma.announcement.create({
    data: {
      message,
      priority,
      authorId: session.user.id,
      isActive: true
    }
  })
  
  revalidatePath('/', 'layout')
}

export async function clearAnnouncements() {
  const session = await auth()
  if (session?.user?.role !== 'DIRECTOR') throw new Error('Unauthorized')

  await prisma.announcement.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  })
  
  revalidatePath('/', 'layout')
}
