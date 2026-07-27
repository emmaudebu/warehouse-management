'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export async function updateInventoryRow(
  productId: string, 
  stockId: string | null,
  data: { 
    name?: string,
    categoryId?: string,
    unit?: string,
    size?: string,
    measurement?: string,
    sellingPrice?: number,
    lowStockThreshold?: number | null,
    quantity?: number 
  }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')
    
    const allowedRoles = ['DIRECTOR', 'FACTORY_MANAGER', 'STORE_KEEPER']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Forbidden: Insufficient privileges')
    }
    
    if (data.quantity !== undefined && data.quantity < 0) {
      throw new Error('Quantity cannot be negative')
    }
    
    if (data.sellingPrice !== undefined && data.sellingPrice < 0) {
      throw new Error('Selling price cannot be negative')
    }
    await prisma.$transaction(async (tx) => {
      // Update global product attributes
      if (data.name || data.categoryId || data.unit || data.size !== undefined || data.measurement !== undefined || data.sellingPrice !== undefined || data.lowStockThreshold !== undefined) {
        await tx.product.update({
          where: { id: productId },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.categoryId && { categoryId: data.categoryId }),
            ...(data.unit && { unit: data.unit }),
            ...(data.size !== undefined && { size: data.size || null }),
            ...(data.measurement !== undefined && { measurement: data.measurement || null }),
            ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
            ...(data.lowStockThreshold !== undefined && { lowStockThreshold: data.lowStockThreshold })
          }
        })
      }

      // Update specific warehouse stock quantity
      if (stockId && data.quantity !== undefined) {
        await tx.stock.update({
          where: { id: stockId },
          data: { quantity: data.quantity }
        })
      }
    })

    revalidatePath('/director')
    revalidatePath('/factory')
    revalidatePath('/storekeeper')
    revalidatePath('/supplier')
    revalidatePath('/', 'layout')
  } catch (error: any) {
    console.error('Update failed:', error)
    return { error: 'Failed to update inventory: ' + error.message }
  }
}

export async function deleteStock(stockId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    await prisma.stock.delete({
      where: { id: stockId }
    })

    revalidatePath('/director')
    revalidatePath('/factory')
    revalidatePath('/storekeeper')
    
    return { success: true }
  } catch (error: any) {
    console.error(error.message)
    return { error: 'Failed to delete stock. It may be linked to existing transfers.' }
  }
}

export async function adjustStock(stockId: string, quantityChange: number, reason: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
      include: { product: true }
    })

    if (!stock) throw new Error('Stock not found')

    await prisma.stock.update({
      where: { id: stockId },
      data: { quantity: { increment: quantityChange } }
    })

    const { logActivity } = await import('@/lib/logger')
    await logActivity(
      session.user.id, 
      `Adjusted stock for ${stock.product.name} by ${quantityChange}`, 
      `Reason: ${reason}`, 
      stock.warehouseId
    )

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: any) {
    return { error: 'Failed to adjust stock: ' + error.message }
  }
}

export async function processReturn(stockId: string, returnQuantity: number, reason: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
      include: { product: true }
    })

    if (!stock) throw new Error('Stock not found')

    await prisma.stock.update({
      where: { id: stockId },
      data: { quantity: { increment: returnQuantity } }
    })

    const { logActivity } = await import('@/lib/logger')
    await logActivity(
      session.user.id, 
      `Processed return for ${stock.product.name} (Qty: ${returnQuantity})`, 
      `Reason: ${reason}`, 
      stock.warehouseId
    )

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: any) {
    return { error: 'Failed to process return: ' + error.message }
  }
}
