'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { logActivity } from '@/lib/logger'

export async function initiateTransfer(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')
    
    const sourceId = formData.get('sourceId') as string
    const destinationId = formData.get('destinationId') as string
    const vehicleNum = formData.get('vehicleNum') as string
    const driverName = formData.get('driverName') as string
    const itemsJson = formData.get('items') as string
    const initiatedById = session.user.id

    if (!sourceId || !destinationId || !itemsJson) {
      throw new Error('Missing required fields')
    }

    const items: { productId: string, quantity: number, packageType?: string, size?: string }[] = JSON.parse(itemsJson)

    if (items.length === 0) {
      throw new Error('No items provided for transfer')
    }

    // Input Validation: Prevent negative quantities
    if (items.some(item => item.quantity <= 0)) {
      throw new Error('Quantity must be greater than zero')
    }

    // Wrap in a transaction: deduct from source available stock, put it in reserved, create transfer record.
    let newTransferId;
    const transactionResult = await prisma.$transaction(async (tx) => {
      let finalDestId = destinationId
      let finalCustomerId = formData.get('customerId') as string | null

      if (finalDestId === 'other') {
        const customDest = formData.get('customDestination') as string
        const customPhone = formData.get('customDestinationPhone') as string
        const locString = customPhone ? `External (Phone: ${customPhone})` : 'External'

        if (!customDest) throw new Error('Custom destination name is required')
        
        // Handle CRM Lite: Find or create customer
        if (customPhone) {
          let customer = await tx.customer.findUnique({ where: { phone: customPhone } })
          if (!customer) {
            customer = await tx.customer.create({
              data: { name: customDest, phone: customPhone }
            })
          } else {
            // Update name if different? Optional.
          }
          finalCustomerId = customer.id
        }

        // Find or create the single generic EXTERNAL warehouse
        let externalWarehouse = await tx.warehouse.findFirst({ where: { type: 'EXTERNAL', name: 'External Customer' } })
        if (!externalWarehouse) {
          externalWarehouse = await tx.warehouse.create({
            data: { name: 'External Customer', location: 'Various', type: 'EXTERNAL' }
          })
        }
        finalDestId = externalWarehouse.id
      }

      // Create transfer record first
      const transfer = await tx.transfer.create({
        data: {
          reference: `TRF-${Date.now()}`,
          sourceId,
          destinationId: finalDestId,
          initiatedById,
          vehicleNum,
          driverName,
          status: 'DRAFT',
          customerId: finalCustomerId || null
        }
      })

      // Check stock and create transfer items
      for (const item of items) {
        const { productId, quantity, packageType, size } = item

        const sourceStocks = await tx.stock.findMany({
          where: { warehouseId: sourceId, productId, quantity: { gte: quantity } }
        })

        if (sourceStocks.length === 0) {
          throw new Error(`Insufficient stock for product ${productId} in source warehouse`)
        }

        const targetStock = sourceStocks[0]

        // Deduct from available, add to reserved
        await tx.stock.update({
          where: { id: targetStock.id },
          data: {
            quantity: { decrement: quantity },
            reserved: { increment: quantity },
            totalSupplied: { increment: quantity }
          }
        })

        // Create transfer item
        await tx.transferItem.create({
          data: {
            transferId: transfer.id,
            productId,
            quantity,
            batchNumber: targetStock.batchNumber,
            packageType,
            size
          }
        })
      }
      return transfer.id
    })

    newTransferId = transactionResult

    if (newTransferId) {
      await logActivity(session.user.id, `Initiated new transfer draft`, `Draft ID: ${newTransferId}`, session.user.warehouseId)
    }

    revalidatePath('/factory')
    revalidatePath('/director')
    revalidatePath('/salesperson')
    revalidatePath('/salesperson/history')
    revalidatePath('/supplier')
    revalidatePath('/storekeeper')
    revalidatePath('/director/admin')
    
    // Redirect to the preview page instead of just staying on the page
    if (newTransferId) {
      redirect(`/supply/${newTransferId}`)
    }
  } catch (error: any) {
    // If it's a redirect error, re-throw it so Next.js handles the redirect properly
    if (error.message === 'NEXT_REDIRECT') {
      throw error
    }
    console.error(error.message)
    return { error: 'Failed to initiate supply: ' + error.message }
  }
}

export async function receiveTransfer(transferId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')
    const approvedById = session.user.id
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: { items: true }
    })

    if (!transfer || transfer.status !== 'PENDING') {
      throw new Error('Invalid or already processed transfer')
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update transfer status to DELIVERED
      await tx.transfer.update({
        where: { id: transferId },
        data: { status: 'DELIVERED', approvedById }
      })

      // 2. Process each item
      for (const item of transfer.items) {
        // Decrease reserved stock in source
        const sourceStock = await tx.stock.findFirst({
          where: { warehouseId: transfer.sourceId, productId: item.productId, batchNumber: item.batchNumber }
        })

        if (sourceStock) {
          await tx.stock.update({
            where: { id: sourceStock.id },
            data: { reserved: { decrement: item.quantity } }
          })
        }

        // Increase available stock in destination
        await tx.stock.upsert({
          where: {
            productId_warehouseId_batchNumber: {
              productId: item.productId,
              warehouseId: transfer.destinationId,
              batchNumber: item.batchNumber || ''
            }
          },
          update: {
            quantity: { increment: item.quantity },
            totalReceived: { increment: item.quantity },
            lastReceivedAt: new Date()
          },
          create: {
            productId: item.productId,
            warehouseId: transfer.destinationId,
            batchNumber: item.batchNumber || '',
            quantity: item.quantity,
            totalReceived: item.quantity,
            lastReceivedAt: new Date()
          }
        })
      }
    })

    await logActivity(session.user.id, `Received transfer #${transferId}`, `Items added to inventory`, session.user.warehouseId)
    if (transfer?.sourceId) {
      await logActivity(session.user.id, `Transfer #${transferId} received by destination`, `Items delivered`, transfer.sourceId)
    }

    revalidatePath('/storekeeper')
    revalidatePath('/supplier')
    revalidatePath('/factory')
    revalidatePath('/director')
    revalidatePath('/salesperson')
    revalidatePath('/', 'layout')
  } catch (error: any) {
    console.error(error.message)
    throw new Error('Failed to receive transfer: ' + error.message)
  }
}

export async function getTransfers({ 
  warehouseId, 
  userId,
  page = 1, 
  limit = 6, 
  sortBy = 'date',
  startDate,
  endDate
}: { 
  warehouseId?: string, 
  userId?: string,
  page?: number, 
  limit?: number, 
  sortBy?: string,
  startDate?: string,
  endDate?: string
}) {
  const where: any = {}
  
  if (warehouseId) {
    where.OR = [
      { sourceId: warehouseId },
      { destinationId: warehouseId }
    ]
  }

  if (userId) {
    where.initiatedById = userId
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`)
    }
    if (endDate) {
      where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`)
    }
  }

  let orderBy: any = { createdAt: 'desc' }
  
  if (sortBy === 'location') {
    orderBy = { destination: { name: 'asc' } }
  } else if (sortBy === 'date') {
    orderBy = { createdAt: 'desc' }
  }

  const total = await prisma.transfer.count({ where })
  const transfers = await prisma.transfer.findMany({
    where,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
    include: {
      source: true,
      destination: true,
      initiatedBy: true,
      items: { include: { product: true } }
    }
  })

  return { transfers, total, totalPages: Math.ceil(total / limit) }
}

// Submits a draft transfer
export async function submitTransfer(transferId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: { destination: true, items: true }
    })

    const newStatus = transfer?.destination?.type === 'EXTERNAL' ? 'DELIVERED' : 'PENDING'

    if (newStatus === 'DELIVERED' && transfer) {
      await prisma.$transaction(async (tx) => {
        await tx.transfer.update({
          where: { id: transferId },
          data: { status: newStatus }
        })
        for (const item of transfer.items) {
          const sourceStock = await tx.stock.findFirst({
            where: { warehouseId: transfer.sourceId, productId: item.productId, batchNumber: item.batchNumber || '' }
          })
          if (sourceStock) {
            await tx.stock.update({
              where: { id: sourceStock.id },
              data: { reserved: { decrement: item.quantity } }
            })
          }
        }
      })
    } else {
      await prisma.transfer.update({
        where: { id: transferId },
        data: { status: newStatus }
      })
    }

    await logActivity(session.user.id, `Submitted transfer #${transferId}`, `Transfer status: ${newStatus}`, session.user.warehouseId)
    if (transfer?.destinationId) {
      await logActivity(session.user.id, `Incoming transfer #${transferId} submitted`, `Expected delivery`, transfer.destinationId)
    }

    revalidatePath('/factory')
    revalidatePath('/director')
    revalidatePath('/salesperson')
    revalidatePath('/salesperson/history')
    revalidatePath('/supplier')
    revalidatePath('/storekeeper')
    revalidatePath('/director/admin')
    revalidatePath('/', 'layout')
    
    redirect(`/invoice/${transferId}`)
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error
    console.error(error.message)
    return { error: 'Failed to submit transfer: ' + error.message }
  }
}

// Cancels a draft and restores reserved stock
export async function cancelTransferDraft(transferId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id: transferId },
        include: { items: true }
      })

      if (!transfer || transfer.status !== 'DRAFT') {
        throw new Error('Invalid transfer or not in draft state')
      }

      // Restore stock
      for (const item of transfer.items) {
        await tx.stock.updateMany({
          where: { productId: item.productId, warehouseId: transfer.sourceId, batchNumber: item.batchNumber || '' },
          data: {
            quantity: { increment: item.quantity },
            reserved: { decrement: item.quantity },
            totalSupplied: { decrement: item.quantity }
          }
        })
      }

      // Delete the transfer
      await tx.transfer.delete({ where: { id: transferId } })
    })

    revalidatePath('/factory')
    revalidatePath('/director')
    revalidatePath('/salesperson')
    revalidatePath('/storekeeper')
    revalidatePath('/supplier')
    
    await logActivity(session.user.id, `Canceled transfer draft`, `Draft ID: ${transferId}`, session.user.warehouseId)
    
    return { success: true }
  } catch (error: any) {
    console.error(error.message)
    return { error: 'Failed to cancel draft: ' + error.message }
  }
}

// Updates a draft transfer
export async function updateTransferDraft(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const transferId = formData.get('transferId') as string
    const vehicleNum = formData.get('vehicleNum') as string
    const driverName = formData.get('driverName') as string
    const itemsJson = formData.get('items') as string

    if (!transferId || !itemsJson) throw new Error('Missing fields')

    const newItems: { productId: string, quantity: number, batchNumber?: string }[] = JSON.parse(itemsJson)

    await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id: transferId },
        include: { items: true }
      })

      if (!transfer || transfer.status !== 'DRAFT') {
        throw new Error('Invalid transfer or not in draft state')
      }

      // Step 1: Un-reserve old items
      for (const item of transfer.items) {
        await tx.stock.updateMany({
          where: { productId: item.productId, warehouseId: transfer.sourceId, batchNumber: item.batchNumber || '' },
          data: {
            quantity: { increment: item.quantity },
            reserved: { decrement: item.quantity },
            totalSupplied: { decrement: item.quantity }
          }
        })
      }

      // Step 2: Delete old items
      await tx.transferItem.deleteMany({ where: { transferId } })

      // Step 3: Reserve new items and create them
      for (const item of newItems) {
        const { productId, quantity } = item
        const sourceStocks = await tx.stock.findMany({
          where: { warehouseId: transfer.sourceId, productId, quantity: { gte: quantity } }
        })

        if (sourceStocks.length === 0) {
          throw new Error(`Insufficient stock for product ${productId}`)
        }

        const targetStock = sourceStocks[0]

        await tx.stock.update({
          where: { id: targetStock.id },
          data: {
            quantity: { decrement: quantity },
            reserved: { increment: quantity },
            totalSupplied: { increment: quantity }
          }
        })

        await tx.transferItem.create({
          data: {
            transferId,
            productId,
            quantity,
            batchNumber: targetStock.batchNumber
          }
        })
      }

      // Step 4: Update transfer logistics
      await tx.transfer.update({
        where: { id: transferId },
        data: { vehicleNum, driverName }
      })
    })

    revalidatePath('/factory')
    revalidatePath('/director')
    return { success: true }
  } catch (error: any) {
    console.error(error.message)
    return { error: 'Failed to update draft: ' + error.message }
  }
}

// Rejects a pending transfer (receiver side)
export async function rejectTransfer(transferId: string, reason: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id: transferId },
        include: { items: true }
      })

      if (!transfer || transfer.status !== 'PENDING') {
        throw new Error('Invalid transfer or not in pending state')
      }

      // Restore stock to source available quantity
      for (const item of transfer.items) {
        await tx.stock.updateMany({
          where: { productId: item.productId, warehouseId: transfer.sourceId, batchNumber: item.batchNumber || '' },
          data: {
            quantity: { increment: item.quantity },
            reserved: { decrement: item.quantity },
            totalSupplied: { decrement: item.quantity }
          }
        })
      }

      // Update transfer status
      await tx.transfer.update({ 
        where: { id: transferId },
        data: { 
          status: 'REJECTED',
          remarks: reason ? `Rejected: ${reason}` : 'Rejected without reason'
        }
      })
    })

    await logActivity(session.user.id, `Rejected transfer #${transferId}`, `Reason: ${reason || 'None provided'}`, session.user.warehouseId)

    revalidatePath('/factory')
    revalidatePath('/director')
    revalidatePath('/salesperson')
    revalidatePath('/storekeeper')
    revalidatePath('/supplier')
    
    return { success: true }
  } catch (error: any) {
    console.error(error.message)
    return { error: 'Failed to reject transfer: ' + error.message }
  }
}

// Cancels a submitted/pending transfer (sender side)
export async function cancelSubmittedTransfer(transferId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id: transferId },
        include: { items: true }
      })

      if (!transfer || transfer.status !== 'PENDING') {
        throw new Error('Invalid transfer or not in pending state')
      }

      // Verify the user owns the source warehouse (security check)
      if (session.user.role !== 'DIRECTOR' && session.user.warehouseId !== transfer.sourceId) {
        throw new Error('Only the sender can cancel this supply')
      }

      // Restore stock
      for (const item of transfer.items) {
        await tx.stock.updateMany({
          where: { productId: item.productId, warehouseId: transfer.sourceId, batchNumber: item.batchNumber || '' },
          data: {
            quantity: { increment: item.quantity },
            reserved: { decrement: item.quantity },
            totalSupplied: { decrement: item.quantity }
          }
        })
      }

      // Update status
      await tx.transfer.update({ 
        where: { id: transferId },
        data: { status: 'CANCELLED', remarks: 'Cancelled by sender' } 
      })
    })

    await logActivity(session.user.id, `Cancelled pending transfer #${transferId}`, `Stock restored`, session.user.warehouseId)

    revalidatePath('/factory')
    revalidatePath('/director')
    revalidatePath('/salesperson')
    revalidatePath('/storekeeper')
    revalidatePath('/supplier')
    
    return { success: true }
  } catch (error: any) {
    console.error(error.message)
    return { error: 'Failed to cancel transfer: ' + error.message }
  }
}
