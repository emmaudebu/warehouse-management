'use server'

import prisma from '@/lib/prisma'

export async function seedDatabase() {
  const existingUsers = await prisma.user.count()
  if (existingUsers > 0) return { message: 'Database already seeded' }

  // 1. Create Users
  const director = await prisma.user.create({
    data: { name: 'Admin Director', username: 'director', email: 'director@fwms.com', password: '$2b$10$Eqir5QW478zo/5hU/toIPOF4mAD21qGJD5Ga6Z3mvYz1OI5TVKTpm', role: 'DIRECTOR' }
  })
  
  const factoryManager = await prisma.user.create({
    data: { name: 'Factory Boss', username: 'factory', email: 'factory@fwms.com', password: '$2b$10$Eqir5QW478zo/5hU/toIPOF4mAD21qGJD5Ga6Z3mvYz1OI5TVKTpm', role: 'FACTORY_MANAGER' }
  })

  // 2. Create Warehouses
  const factoryWarehouse = await prisma.warehouse.create({
    data: { name: 'Main Factory Warehouse', location: 'Industrial Area', type: 'FACTORY' }
  })
  
  const marketWarehouse = await prisma.warehouse.create({
    data: { name: 'Central Market Store', location: 'Downtown Market', type: 'MARKET' }
  })
  
  const supplierStore = await prisma.warehouse.create({
    data: { name: 'Supplier A Hub', location: 'East District', type: 'SUPPLIER' }
  })

  // Link users to their respective warehouses
  await prisma.user.update({ where: { id: factoryManager.id }, data: { warehouseId: factoryWarehouse.id } })
  
  const storeKeeper = await prisma.user.create({
    data: { name: 'Market Keeper', username: 'keeper', email: 'keeper@fwms.com', password: '$2b$10$Eqir5QW478zo/5hU/toIPOF4mAD21qGJD5Ga6Z3mvYz1OI5TVKTpm', role: 'STORE_KEEPER', warehouseId: marketWarehouse.id }
  })
  
  const supplierUser = await prisma.user.create({
    data: { name: 'Supplier Contact', username: 'supplier', email: 'supplier@fwms.com', password: '$2b$10$Eqir5QW478zo/5hU/toIPOF4mAD21qGJD5Ga6Z3mvYz1OI5TVKTpm', role: 'SUPPLIER', warehouseId: supplierStore.id }
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

  return { message: 'Database successfully seeded with Cosmetic Products!' }
}
