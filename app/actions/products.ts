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

export async function bulkUploadProducts(productsData: any[]) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    let successCount = 0
    const errors: string[] = []

    const warehouses = await prisma.warehouse.findMany()

    for (const data of productsData) {
      try {
        const name = data['Name'] || data['name']
        const catName = data['Category'] || data['category'] || data['Category Name']
        
        // Skip entirely empty rows
        if (!name && !catName) continue;

        if (!name || !catName) {
           errors.push(`Row missing Name or Category. Name: ${name}`)
           continue
        }

        // Ensure category exists
        let category = await prisma.category.findUnique({ where: { name: catName } })
        if (!category) {
          category = await prisma.category.create({ data: { name: catName } })
        }

        const unit = data['Unit'] || data['unit'] || 'Quantity'
        const size = data['Size'] || data['size'] || null
        const measurement = data['Measurement'] || data['measurement'] || null
        const sellingPrice = parseFloat(data['Selling Price'] || data['sellingPrice']) || 0
        const costPrice = parseFloat(data['Cost Price'] || data['costPrice']) || 0
        const lowStockThresholdStr = data['Low Stock Threshold'] || data['lowStockThreshold']
        const lowStockThreshold = lowStockThresholdStr ? parseInt(lowStockThresholdStr) : null
        
        const initialQty = parseInt(data['Initial Quantity'] || data['Quantity'] || data['quantity']) || 0

        let sku = data['SKU'] || data['sku']
        if (!sku) {
           const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD')
           const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase()
           sku = `${prefix}-${randomChars}`
        }

        // Check SKU
        const existing = await prisma.product.findUnique({ where: { sku } })
        if (existing) {
          errors.push(`SKU ${sku} already exists for product ${name}`)
          continue
        }

        const newProduct = await prisma.product.create({
          data: {
            name, sku, categoryId: category.id, unit, size, measurement, sellingPrice, costPrice, lowStockThreshold
          }
        })

        if (warehouses.length > 0) {
          await prisma.stock.createMany({
            data: warehouses.map(w => ({
              productId: newProduct.id,
              warehouseId: w.id,
              quantity: session.user.warehouseId === w.id ? initialQty : 0
            }))
          })
        }
        successCount++
      } catch (err: any) {
        errors.push(`Failed to import product ${data['Name']}: ${err.message}`)
      }
    }
    
    revalidatePath('/factory')
    revalidatePath('/storekeeper')
    revalidatePath('/director')
    
    return { success: true, count: successCount, errors }
  } catch (error: any) {
    return { error: error.message }
  }
}
