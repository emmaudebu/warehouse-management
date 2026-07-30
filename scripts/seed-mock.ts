import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const existingWarehouses = await prisma.warehouse.count()
  if (existingWarehouses > 0) {
    console.log('Warehouses already exist. Skipping seed.')
    return
  }

  // 1. Create Warehouses
  const factoryWarehouse = await prisma.warehouse.create({
    data: { name: 'Main Factory Warehouse', location: 'Industrial Area', type: 'FACTORY' }
  })
  
  const marketWarehouse = await prisma.warehouse.create({
    data: { name: 'Central Market Store', location: 'Downtown Market', type: 'MARKET' }
  })
  
  const supplierStore = await prisma.warehouse.create({
    data: { name: 'Supplier A Hub', location: 'East District', type: 'SUPPLIER' }
  })

  // 2. Create Users
  const hashedPassword = await bcrypt.hash('password123', 10)

  const factoryManager = await prisma.user.create({
    data: { name: 'Factory Boss', username: 'factory', email: 'factory@fwms.com', password: hashedPassword, role: 'FACTORY_MANAGER', warehouseId: factoryWarehouse.id }
  })

  const storeKeeper = await prisma.user.create({
    data: { name: 'Market Keeper', username: 'keeper', email: 'keeper@fwms.com', password: hashedPassword, role: 'STORE_KEEPER', warehouseId: marketWarehouse.id }
  })
  
  const supplierUser = await prisma.user.create({
    data: { name: 'Supplier Contact', username: 'supplier', email: 'supplier@fwms.com', password: hashedPassword, role: 'SUPPLIER', warehouseId: supplierStore.id }
  })

  // 3. Create Categories
  const catBody = await prisma.category.create({ data: { name: 'Body Care' } })
  const catHair = await prisma.category.create({ data: { name: 'Hair Care' } })
  const catFace = await prisma.category.create({ data: { name: 'Face Care' } })

  // 4. Create Cosmetic Products
  const bodyLotion = await prisma.product.create({
    data: { name: 'Shea Butter Body Lotion', sku: 'BL-001', brand: 'GlowCosmetics', categoryId: catBody.id, unit: 'Cartons', costPrice: 4000, sellingPrice: 4500 }
  })
  
  const faceScrub = await prisma.product.create({
    data: { name: 'Apricot Face Scrub', sku: 'FS-012', brand: 'GlowCosmetics', categoryId: catFace.id, unit: 'Packs', costPrice: 8000, sellingPrice: 9500 }
  })

  // 5. Add initial stock to factory
  await prisma.stock.create({
    data: { productId: bodyLotion.id, warehouseId: factoryWarehouse.id, quantity: 500, batchNumber: 'LOTION-BATCH-1' }
  })
  
  await prisma.stock.create({
    data: { productId: faceScrub.id, warehouseId: factoryWarehouse.id, quantity: 1200, batchNumber: 'SCRUB-BATCH-1' }
  })

  console.log('✅ Database successfully seeded with Warehouses, Users, Categories, and Products!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
