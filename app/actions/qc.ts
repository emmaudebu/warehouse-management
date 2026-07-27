'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export async function processQualityHold(batchNumber: string, status: 'QC_HOLD' | 'SELLABLE' | 'QUARANTINED', reason?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')
    
    // As per PRD REQ-QC-02: Propagate a quality hold on a given batch to ALL sites currently holding that batch.
    await prisma.$transaction(async (tx) => {
      await tx.stock.updateMany({
        where: { batchNumber },
        data: { status }
      })
      
      // Optionally create a Quality Hold log here if we add a model for it.
    })

    revalidatePath('/qc')
    return { success: true }
  } catch (error: any) {
    console.error('Process QC Hold failed:', error)
    return { success: false, error: error.message }
  }
}
