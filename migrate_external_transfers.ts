import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const transfers = await prisma.transfer.findMany({
    where: {
      status: 'PENDING',
      destination: { type: 'EXTERNAL' }
    },
    include: { items: true }
  })

  console.log(`Found ${transfers.length} PENDING external transfers to process...`)

  for (const transfer of transfers) {
    await prisma.$transaction(async (tx) => {
      // 1. Update transfer status to DELIVERED
      await tx.transfer.update({
        where: { id: transfer.id },
        data: { status: 'DELIVERED' }
      })

      // 2. Decrease reserved stock in source
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
    console.log(`Processed transfer ${transfer.reference}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
