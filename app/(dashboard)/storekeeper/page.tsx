import Card from '@/components/Card'
import prisma from '@/lib/prisma'
import { receiveTransfer } from '@/app/actions/transfers'
import TransferActionButtons from '@/components/TransferActionButtons'
import InventoryTable from '@/components/InventoryTable'
import ManualSupplyForm from '@/components/ManualSupplyForm'
import { addProduct } from '@/app/actions/products'
import TransferHistory from '@/components/TransferHistory'
import LowStockAlerts from '@/components/LowStockAlerts'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function MarketDashboard() {
  const session = await auth()
  if (!session?.user?.id) return redirect('/login')
  
  const settings = await prisma.companySettings.findFirst()
  const threshold = settings?.globalLowStockThreshold || 50
  
  const role = session?.user?.role
  const marketWarehouse = await prisma.warehouse.findFirst({ where: { type: 'MARKET' } })
  
  if (!marketWarehouse) {
    return <div>No Market Warehouse found. Please seed the database.</div>
  }

  const categories = await prisma.category.findMany()

  // Live Metrics
  const stocks = await prisma.stock.findMany({
    where: { warehouseId: marketWarehouse.id },
    include: { product: true }
  })
  
  const currentStock = stocks.reduce((acc, stock) => acc + stock.quantity, 0)
  const lowStockItems = stocks.filter(s => s.quantity <= threshold)

  // Today's Deliveries (Completed today)
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  
  const todaysDeliveries = await prisma.transfer.count({
    where: { 
      destinationId: marketWarehouse.id, 
      status: 'DELIVERED',
      updatedAt: { gte: startOfDay }
    }
  })

  const pendingTransfers = await prisma.transfer.findMany({
    where: { destinationId: marketWarehouse.id, status: 'PENDING' },
    include: {
      source: true,
      items: { include: { product: true } }
    }
  })

  // Fetch data for supply forms
  const destinations = await prisma.warehouse.findMany({
    where: { id: { not: marketWarehouse.id }, type: { not: 'EXTERNAL' } }
  })
  const products = await prisma.product.findMany({ include: { category: true } })

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <header id="overview">
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Storekeeper Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage inventory and deliveries at {marketWarehouse.name}.</p>
      </header>

      {/* KPI Summary Cards */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <DashboardMetric title="Warehouse Stock" value={currentStock.toLocaleString()} change="Total items" />
          <DashboardMetric title="Today's Deliveries" value={todaysDeliveries.toString()} change="Completed today" />
          <DashboardMetric title="Pending Deliveries" value={pendingTransfers.length.toString()} change="Awaiting verification" isAlert={pendingTransfers.length > 0} />
          <DashboardMetric title="Low Stock" value={lowStockItems.length.toString()} change="Items need restock" isAlert={lowStockItems.length > 0} />
        </div>
        <LowStockAlerts warehouseId={marketWarehouse.id} />
      </section>

      {/* Inventory Management Section */}
      <section id="inventory">
        <h2 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Storekeeper Inventory</h2>
        <InventoryTable 
          stocks={stocks} 
          categories={categories} 
          role={role} 
          sourceWarehouseId={marketWarehouse.id}
          destinations={destinations}
        />
      </section>

      {/* Pending Deliveries & Stock Table */}
      <section id="actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Pending Deliveries */}
        <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🚚 Incoming Supplies</h3>
          {pendingTransfers.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No incoming supplies.</div>
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

        {/* Quick Stock Check */}
        <Card>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)' }}>Low Stock Items</h3>
          {lowStockItems.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>All items are sufficiently stocked.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {lowStockItems.map(item => (
                <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.product.name}</span>
                  <span style={{ color: 'var(--warning-color)', fontWeight: 600 }}>{item.quantity} {item.product.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Manual Supply Request Form */}
        <ManualSupplyForm 
          sourceId={marketWarehouse.id} 
          destinations={destinations} 
          products={products} 
        />

      </section>

      {/* Activity Logs Section */}
      <section id="history">
        <TransferHistory warehouseId={marketWarehouse.id} />
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
      <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{label}</label>
      {type === 'select' ? (
        <select name={name} required style={{
          padding: '0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: 'var(--bg-dark)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-light)',
          outline: 'none'
        }}>
          {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <input type={type} name={name} placeholder={placeholder} required style={{
          padding: '0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: 'var(--bg-dark)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-light)',
          outline: 'none'
        }} />
      )}
    </div>
  )
}
