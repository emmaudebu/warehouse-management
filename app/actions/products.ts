'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export async function addProduct(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const name = formData.get('name') as string
    const categoryId = formData.get('categoryId') as string
    const unit = formData.get('unit') as string || 'Quantity'
    const size = formData.get('size') as string | null
    const measurement = formData.get('measurement') as string | null
    const quantity = parseInt(formData.get('quantity') as string) || 0
    const sellingPrice = parseFloat(formData.get('sellingPrice') as string) || 0
    const lowStockThresholdStr = formData.get('lowStockThreshold') as string
    const lowStockThreshold = lowStockThresholdStr ? parseInt(lowStockThresholdStr) : null

    if (!name || !categoryId) {
      throw new Error('Missing required fields')
    }

    // Auto-generate SKU
    const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD')
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase()
    const sku = `${prefix}-${randomChars}`

    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    })

    if (existingProduct) {
      // In a real app we might retry generation, but collision is highly unlikely with 6 base36 chars
      return { error: `SKU collision detected, please try saving again.` }
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        sku,
        categoryId,
        unit,
        size: size || null,
        measurement: measurement || null,
        sellingPrice,
        lowStockThreshold
      }
    })

    // Fetch all warehouses
    const warehouses = await prisma.warehouse.findMany()

    // Create an empty stock record for the new product in every warehouse (except user's warehouse, which gets the quantity)
    if (warehouses.length > 0) {
      await prisma.stock.createMany({
        data: warehouses.map(w => ({
          productId: newProduct.id,
          warehouseId: w.id,
          quantity: session.user.warehouseId === w.id ? quantity : 0
        }))
      })
    }

    revalidatePath('/factory')
    revalidatePath('/storekeeper')
    revalidatePath('/director')
    
    return { success: true }
  } catch (error: any) {
    console.error(error.message)
    return { error: 'Failed to add product: ' + error.message }
  }
}
