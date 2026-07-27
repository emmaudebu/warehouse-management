const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const transfers = await prisma.transfer.findMany({
    include: { initiatedBy: true }
  })
  console.log("Transfers:", transfers)
}

main().catch(console.error).finally(() => prisma.$disconnect())
