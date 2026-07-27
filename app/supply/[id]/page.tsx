import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SupplyPreviewClient from './SupplyPreviewClient'
import { auth } from '@/auth'

export default async function SupplyPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const transfer = await prisma.transfer.findUnique({
    where: { id },
    include: {
      source: true,
      destination: true, customer: true,
      initiatedBy: true,
      items: { include: { product: { include: { category: true } } } }
    }
  })

  if (!transfer) {
    return <div>Transfer not found</div>
  }

  const isFinalized = transfer.status !== 'DRAFT'
  const products = await prisma.product.findMany({ include: { category: true } })

  return <SupplyPreviewClient transfer={transfer as any} products={products} isFinalized={isFinalized} />
}
