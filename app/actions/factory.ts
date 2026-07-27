'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

import { auth } from '@/auth'

export async function recordProduction(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')
    const productId = formData.get('productId') as string
    const quantity = parseInt(formData.get('quantity') as string)
    const warehouseId = formData.get('warehouseId') as string

    // Auto-generate Batch Number: BAT-YYYYMMDD-HHMMSS
    const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const batchNumber = `BAT-${dateStr}`

    if (!productId || !quantity || !warehouseId) {
      throw new Error('Missing required fields')
    }

    // Upsert stock record for this product/warehouse/batch
    await prisma.stock.upsert({
      where: {
        productId_warehouseId_batchNumber: {
          productId,
          warehouseId,
          batchNumber: batchNumber || ''
        }
      },
      update: {
        quantity: { increment: quantity }
      },
      create: {
        productId,
        warehouseId,
        batchNumber: batchNumber || '',
        quantity
      }
    })

    revalidatePath('/factory')
  } catch (error: any) {
    console.error(error.message)
    throw new Error('Failed to record production: ' + error.message)
  }
}
