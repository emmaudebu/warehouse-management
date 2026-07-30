const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const res = await prisma.$transaction([
      prisma.companySettings.findFirst(),
      prisma.warehouse.findMany({ where: { type: { not: 'EXTERNAL' } } }),
      prisma.user.findMany({ include: { warehouse: true } }),
      prisma.expense.findMany({ orderBy: { date: 'desc' }, take: 10, include: { recordedBy: true } }),
      prisma.announcement.findFirst({ where: { isActive: true } })
    ])
    console.log("Success:", res.length)
  } catch (e) {
    console.error("Prisma error:", e)
  }
}
main().finally(() => prisma.$disconnect())
