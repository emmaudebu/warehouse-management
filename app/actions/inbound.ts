'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export async function receiveASN(data: {
  purchaseOrderId: string;
  warehouseId: string;
  reference: string;
  items: {
    productId: string;
    quantity: number;
    batchNumber: string;
    mfgDate?: Date;
    expDate?: Date;
  }[]
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')
    
    await prisma.$transaction(async (tx) => {
      // Create Receipt
      const receipt = await tx.receipt.create({
        data: {
          reference: data.reference,
          purchaseOrderId: data.purchaseOrderId,
          warehouseId: data.warehouseId,
          receivedById: session.user.id,
          status: "RECEIVED",
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              batchNumber: item.batchNumber,
              mfgDate: item.mfgDate,
              expDate: item.expDate,
              status: "QC_HOLD" // Default per cosmetics PRD
            }))
          }
        }
      })

      // Create Stock entries (in QC_HOLD by default)
      for (const item of data.items) {
        // Find existing stock for this batch and location
        const existingStock = await tx.stock.findFirst({
          where: {
            productId: item.productId,
            warehouseId: data.warehouseId,
            batchNumber: item.batchNumber,
            locationId: null // Pending putaway
          }
        })

        if (existingStock) {
          await tx.stock.update({
            where: { id: existingStock.id },
            data: { quantity: existingStock.quantity + item.quantity }
          })
        } else {
          await tx.stock.create({
            data: {
              productId: item.productId,
              warehouseId: data.warehouseId,
              quantity: item.quantity,
              batchNumber: item.batchNumber,
              mfgDate: item.mfgDate,
              expDate: item.expDate,
              status: "QC_HOLD"
            }
          })
        }

        // Update PO received quantity
        const poItem = await tx.purchaseOrderItem.findFirst({
          where: {
            purchaseOrderId: data.purchaseOrderId,
            productId: item.productId
          }
        })

        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: {
              receivedQty: poItem.receivedQty + item.quantity
            }
          })
        }
      }
      
      // Check if PO is fully received
      const allPoItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: data.purchaseOrderId }
      })
      
      const allReceived = allPoItems.length > 0 && allPoItems.every(item => item.receivedQty >= item.expectedQty)
      if (allReceived) {
        await tx.purchaseOrder.update({
          where: { id: data.purchaseOrderId },
          data: { status: "COMPLETED" }
        })
      } else {
        await tx.purchaseOrder.update({
          where: { id: data.purchaseOrderId },
          data: { status: "PARTIAL" }
        })
      }
    })

    revalidatePath('/inbound')
    return { success: true }
  } catch (error: any) {
    console.error('Receive ASN failed:', error)
    return { success: false, error: error.message }
  }
}
