'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: { name: string, phone: string, email: string, password?: string }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }

  const userId = session.user.id

  const updateData: any = {
    name: data.name,
    phone: data.phone,
  }

  if (data.email) {
    updateData.email = data.email
  }

  if (data.password && data.password.trim() !== '') {
    const hashedPassword = await bcrypt.hash(data.password, 10)
    updateData.password = hashedPassword
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    })
    
    revalidatePath('/')
    revalidatePath('/profile')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to update profile:', error)
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
       return { success: false, error: 'Email already in use.' }
    }
    return { success: false, error: 'Failed to update profile.' }
  }
}
