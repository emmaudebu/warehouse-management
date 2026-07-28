import Card from '@/components/Card'
import prisma from '@/lib/prisma'
import { receiveTransfer } from '@/app/actions/transfers'
import TransferActionButtons from '@/components/TransferActionButtons'
import InventoryTable from '@/components/InventoryTable'
import ManualSupplyForm from '@/components/ManualSupplyForm'
import TransferHistory from '@/components/TransferHistory'
import LowStockAlerts from '@/components/LowStockAlerts'
import { auth } from '@/auth'

export default async function SupplierDashboard() {
  const session = await auth()
  const role = session?.user?.role
  const supplierWarehouse = await prisma.warehouse.findFirst({ where: { type: 'SUPPLIER' } })
  
  if (!supplierWarehouse) {
    return <div>No Supplier Warehouse found. Please seed the database.</div>
  }

  const categories = await prisma.category.findMany()

  // Live Metrics
  const stocks = await prisma.stock.findMany({
    where: { warehouseId: supplierWarehouse.id },
    include: { product: true }
  })
  
  const currentBalance = stocks.reduce((acc, stock) => acc + stock.quantity, 0)

  const pendingTransfers = await prisma.transfer.findMany({
    where: { destinationId: supplierWarehouse.id, status: 'PENDING' },
    include: {
      source: true,
      items: { include: { product: true } }
    }
  })

  const completedTransfers = await prisma.transfer.findMany({
    where: { destinationId: supplierWarehouse.id, status: 'DELIVERED' },
    include: { items: true }
  })

  let productsReceived = 0
  completedTransfers.forEach(t => {
    t.items.forEach(i => productsReceived += i.quantity)
  })

  // Fetch data for supply forms
  const destinations = await prisma.warehouse.findMany({
    where: { id: { not: supplierWarehouse.id }, type: { not: 'EXTERNAL' } }
  })
  const products = await prisma.product.findMany({ include: { category: true } })

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <header id="overview">
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Supplier Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage incoming supplies and inventory at {supplierWarehouse.name}.</p>
      </header>

      {/* KPI Summary Cards */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <DashboardMetric title="Products Received" value={productsReceived.toLocaleString()} change="Total items historical" />
          <DashboardMetric title="Products Delivered" value="0" change="To customers (Mock)" />
          <DashboardMetric title="Pending Deliveries" value={pendingTransfers.length.toString()} change="Awaiting acceptance" isAlert={pendingTransfers.length > 0} />
          <DashboardMetric title="Current Balance" value={currentBalance.toLocaleString()} change="Available stock" />
        </div>
        <LowStockAlerts warehouseId={supplierWarehouse.id} />
      </section>

      {/* Inventory Management Section */}
      <section id="inventory">
        <h2 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Supplier Inventory</h2>
        <InventoryTable 
          stocks={stocks} 
          categories={categories} 
          role={role} 
          sourceWarehouseId={supplierWarehouse.id}
          destinations={destinations}
        />
      </section>

      {/* Pending Deliveries */}
      <section id="actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🚚 Incoming Supplies</h3>
          {pendingTransfers.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>You have no incoming supplies currently.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingTransfers.map(transfer => (
                <div key={transfer.id} style={{ 
                  backgroundColor: 'var(--bg-dark)', 
                  padding: '1rem', 
                  borderRadius: '0.5rem', 
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-light)' }}>{transfer.reference}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>From: {transfer.source.name}</div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Vehicle: {transfer.vehicleNum || 'N/A'}
                    </div>
                  </div>
                  
                  {transfer.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--bg-darker)', padding: '0.75rem', borderRadius: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{item.product.name}</span>
                      <span style={{ fontWeight: 600 }}>{item.quantity} {item.product.unit}</span>
                    </div>
                  ))}
                  
                  <div style={{ marginTop: '0.5rem' }}>
                    <TransferActionButtons transferId={transfer.id} mode="RECEIVER" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Manual Supply Request Form */}
        <ManualSupplyForm 
          sourceId={supplierWarehouse.id} 
          destinations={destinations} 
          products={products} 
        />

      </section>

      {/* Activity Logs Section */}
      <section id="history">
        <TransferHistory warehouseId={supplierWarehouse.id} />
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
