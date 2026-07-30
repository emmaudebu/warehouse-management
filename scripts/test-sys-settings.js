const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function getSystemSettings() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' }
  })
  return settings
}

async function main() {
  try {
    const sysSettings = await getSystemSettings()
    console.log("sysSettings:", sysSettings)
  } catch (e) {
    console.error("Error in getSystemSettings:", e)
  }
}
main().finally(() => prisma.$disconnect())
