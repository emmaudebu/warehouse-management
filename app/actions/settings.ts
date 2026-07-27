'use server'

import prisma from '@/lib/prisma'

export async function getSystemSettings() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' }
  })
  return settings
}

export async function getCompanySettings() {
  const settings = await prisma.companySettings.findFirst()
  return settings
}
