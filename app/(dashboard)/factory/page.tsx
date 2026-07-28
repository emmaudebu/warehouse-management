import Card from '@/components/Card'
import prisma from '@/lib/prisma'
import { recordProduction } from '@/app/actions/factory'

import InventoryTable from '@/components/InventoryTable'
import AddProductForm from '@/components/AddProductForm'
import BulkProductUpload from '@/components/BulkProductUpload'
import ExportCSVButton from '@/components/ExportCSVButton'
import ManualSupplyForm from '@/components/ManualSupplyForm'
import TransferHistory from '@/components/TransferHistory'
import LowStockAlerts from '@/components/LowStockAlerts'
import { auth } from '@/auth'

export default async function FactoryDashboard() {
  const session = await auth()
  const role = session?.user?.role
  const factoryWarehouse = await prisma.warehouse.findFirst({ where: { type: 'FACTORY' } })
  
  if (!factoryWarehouse) {
    return <div>No Factory Warehouse found. Please seed the database.</div>
  }

  // Live Metrics
  const stocks = await prisma.stock.findMany({
    where: { warehouseId: factoryWarehouse.id },
    include: { product: true }
  })
  
  const currentStock = stocks.reduce((acc, stock) => acc + stock.quantity, 0)

  const pendingDeliveries = await prisma.transfer.count({
    where: { sourceId: factoryWarehouse.id, status: 'PENDING' }
  })
  
  const completedDeliveries = await prisma.transfer.count({
    where: { sourceId: factoryWarehouse.id, status: 'DELIVERED' }
  })

  // Data for forms
  const products = await prisma.product.findMany({ include: { category: true } })
  const categories = await prisma.category.findMany()
  const destinations = await prisma.warehouse.findMany({
    where: { id: { not: factoryWarehouse.id }, type: { not: 'EXTERNAL' } }
  })

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <header id="overview">
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Factory Manager 🏭</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage production and initiate supplies from {factoryWarehouse.name}.</p>
      </header>

      {/* KPI Summary Cards */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <DashboardMetric title="Current Stock" value={currentStock.toLocaleString()} change="Total Items Available" />
          <DashboardMetric title="Pending Deliveries" value={pendingDeliveries.toString()} change="Awaiting transit/acceptance" isAlert={pendingDeliveries > 0} />
          <DashboardMetric title="Completed Deliveries" value={completedDeliveries.toString()} change="Products sent successfully" />
          <DashboardMetric title="Products Tracked" value={products.length.toString()} change="Active in catalog" />
        </div>
        <LowStockAlerts warehouseId={factoryWarehouse.id} />
      </section>

      <section id="inventory">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>Factory Inventory</h2>
          <ExportCSVButton 
            data={products.map(p => ({
              ID: p.id,
              Name: p.name,
              SKU: p.sku,
              Category: p.category.name,
              Unit: p.unit,
              "Cost Price": p.costPrice,
              "Selling Price": p.sellingPrice,
              "Low Stock Threshold": p.lowStockThreshold || 0
            }))} 
            filename="products_export" 
          />
        </div>
        <InventoryTable 
          stocks={stocks} 
          categories={categories} 
          role={role} 
          sourceWarehouseId={factoryWarehouse.id} 
          destinations={destinations} 
        />
      </section>

      {/* Action Forms Section */}
      <section id="actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Add Product Form */}
        <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📦 Add New Product</h3>
          <AddProductForm categories={categories} />
          
          <hr style={{ margin: '2rem 0', borderColor: 'var(--border-color)', opacity: 0.5 }} />
          
          <BulkProductUpload />
        </Card>
        
        {/* Record Production Form */}
        <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🏭 Record New Production</h3>
          <form action={recordProduction} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input type="hidden" name="warehouseId" value={factoryWarehouse.id} />
            
            <FormGroup label="Product" type="select" name="productId" options={products.map(p => ({ label: p.name, value: p.id }))} />
            <FormGroup label="Quantity Built" type="number" name="quantity" placeholder="e.g. 2000" />
            <FormGroup label="Package" type="select" name="package" options={[
              {label: 'Pack', value: 'Pack'}, 
              {label: 'Half Pack', value: 'Half Pack'}, 
              {label: 'Carton', value: 'Carton'}
            ]} />
            
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>Save Production 🚀</button>
            </div>
          </form>
        </Card>

        {/* Manual Supply Request Form */}
        <ManualSupplyForm 
          sourceId={factoryWarehouse.id} 
          destinations={destinations} 
          products={products} 
        />

      </section>

      {/* Activity Logs Section */}
      <section id="history">
        <TransferHistory warehouseId={factoryWarehouse.id} />
      </section>

    </div>
  )
}

function DashboardMetric({ title, value, change, isAlert = false }: { title: string, value: string, change: string, isAlert?: boolean }) {
  return (
    <Card className="hover-scale">
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: '0.5rem' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: isAlert ? 'var(--warning-color)' : 'var(--success-color)' }}>{change}</div>
    </Card>
  )
}

function FormGroup({ label, type, name, placeholder, options }: { label: string, type: string, name: string, placeholder?: string, options?: {label: string, value: string}[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>
      {type === 'select' ? (
        <select name={name} required style={{
          padding: '0.875rem',
          borderRadius: '0.75rem',
          backgroundColor: 'var(--bg-dark)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-light)',
          outline: 'none',
          width: '100%'
        }}>
          {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <input type={type} name={name} placeholder={placeholder} required={name !== 'batchNumber'} style={{
          padding: '0.875rem',
          borderRadius: '0.75rem',
          backgroundColor: 'var(--bg-dark)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-light)',
          outline: 'none',
          width: '100%'
        }} />
      )}
    </div>
  )
}
