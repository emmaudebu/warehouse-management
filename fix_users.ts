import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  for (const user of users) {
    if (user.email !== user.email.toLowerCase()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { email: user.email.toLowerCase() }
      })
      console.log(`Lowercased email for ${user.email}`)
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
