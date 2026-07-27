'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export async function getCustomers() {
  const session = await auth()
  if (!session?.user) return []
  return await prisma.customer.findMany({ orderBy: { name: 'asc' } })
}
