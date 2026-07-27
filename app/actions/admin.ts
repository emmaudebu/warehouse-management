'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

export async function updateCompanySettings(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'DIRECTOR') throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const logoUrl = formData.get('logoUrl') as string
  const whatsappTemplate = formData.get('whatsappTemplate') as string
  const globalLowStockThreshold = parseInt(formData.get('globalLowStockThreshold') as string) || 50

  const settings = await prisma.companySettings.findFirst()
  if (settings) {
    await prisma.companySettings.update({
      where: { id: settings.id },
      data: { name, address, logoUrl, whatsappTemplate, globalLowStockThreshold }
    })
  } else {
    await prisma.companySettings.create({
      data: { name, address, logoUrl, whatsappTemplate, globalLowStockThreshold }
    })
  }
  revalidatePath('/director/admin')
  revalidatePath('/', 'layout')
}

export async function createWarehouse(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'DIRECTOR') throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const location = formData.get('location') as string
  const type = formData.get('type') as string

  await prisma.warehouse.create({
    data: { name, location, type }
  })
  
  // Create zero-stock records for all existing products in the new warehouse
  const products = await prisma.product.findMany()
  const newWarehouse = await prisma.warehouse.findFirst({ orderBy: { createdAt: 'desc' }})
  
  if (newWarehouse && products.length > 0) {
    await prisma.stock.createMany({
      data: products.map(p => ({
        productId: p.id,
        warehouseId: newWarehouse.id,
        quantity: 0
      }))
    })
  }
  
  revalidatePath('/director/admin')
}

export async function createUser(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'DIRECTOR') throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const username = (formData.get('username') as string).toLowerCase()
  const emailRaw = formData.get('email') as string
  const email = emailRaw ? emailRaw.toLowerCase() : null
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const phone = formData.get('phone') as string
  const warehouseId = formData.get('warehouseId') as string

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
      role,
      phone: phone || null,
      warehouseId: warehouseId ? warehouseId : null
    }
  })
  revalidatePath('/director/admin')
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (session?.user?.role !== 'DIRECTOR') throw new Error('Unauthorized')

  try {
    await prisma.user.delete({
      where: { id: userId }
    })
    revalidatePath('/director/admin')
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: 'Failed to delete user. They may have related records (like transfers) that prevent deletion. Consider suspending them instead.' }
  }
}

export async function toggleUserStatus(userId: string, currentStatus: string) {
  const session = await auth()
  if (session?.user?.role !== 'DIRECTOR') throw new Error('Unauthorized')

  const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
  
  await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus }
  })
  revalidatePath('/director/admin')
}
