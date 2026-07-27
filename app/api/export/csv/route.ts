import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  
  if (!session || session.user.role !== 'DIRECTOR') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const transfers = await prisma.transfer.findMany({
      include: {
        source: true,
        destination: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Construct CSV String
    const headers = ['Reference', 'Date', 'Status', 'Source', 'Destination', 'Product', 'Quantity']
    const rows = transfers.flatMap(t => 
      t.items.map(item => [
        t.reference,
        t.createdAt.toISOString(),
        t.status,
        t.source.name,
        t.destination.name,
        item.product.name,
        item.quantity.toString()
      ])
    )

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="fwms-transfers.csv"'
      }
    })
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 })
  }
}
