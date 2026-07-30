import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminExists = await prisma.user.findUnique({
    where: { username: 'admin' }
  })

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
      data: {
        name: 'System Administrator',
        username: 'admin',
        password: hashedPassword,
        role: 'DIRECTOR',
        phone: '+2340000000000',
        status: 'ACTIVE'
      }
    })
    console.log('✅ Default admin created: Username: admin, Password: admin123')
  } else {
    console.log('Admin already exists')
  }

  const settingsExist = await prisma.companySettings.findFirst()
  if (!settingsExist) {
    await prisma.companySettings.create({
      data: {
        name: 'My Warehouse',
        globalLowStockThreshold: 10
      }
    })
    console.log('✅ Default company settings created')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
