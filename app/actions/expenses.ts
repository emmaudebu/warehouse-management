'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export async function addExpense(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'DIRECTOR') throw new Error('Unauthorized')

  const amount = parseFloat(formData.get('amount') as string)
  const category = formData.get('category') as string
  const description = formData.get('description') as string

  await prisma.expense.create({
    data: {
      amount,
      category,
      description,
      recordedById: session.user.id
    }
  })
  
  revalidatePath('/director/admin')
  revalidatePath('/director')
}

export async function deleteExpense(id: string) {
  const session = await auth()
  if (session?.user?.role !== 'DIRECTOR') throw new Error('Unauthorized')

  await prisma.expense.delete({ where: { id } })
  revalidatePath('/director/admin')
  revalidatePath('/director')
}
