import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ManualSupplyForm from '@/components/ManualSupplyForm'
import Card from '@/components/Card'

import TransferActionButtons from '@/components/TransferActionButtons'

export default async function SalespersonDashboard() {
  const session = await auth()
  if (session?.user?.role !== 'SALESPERSON') {
    redirect('/')
  }

  const warehouseId = session.user.warehouseId
  if (!warehouseId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2 style={{ color: 'var(--danger-color)' }}>Access Denied</h2>
        <p>You have not been assigned to a warehouse. Please contact the Director.</p>
      </div>
    )
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
    include: { stocks: { include: { product: { include: { category: true } } } } }
  })

  if (!warehouse) return <div>Warehouse not found</div>

  const pendingTransfers = await prisma.transfer.findMany({
    where: { destinationId: warehouseId, status: 'PENDING' },
    include: {
      source: true,
      items: { include: { product: true } }
    }
  })

  const availableProductsMap = new Map()
  warehouse.stocks.filter(s => s.quantity > 0).forEach(s => {
    if (!availableProductsMap.has(s.product.id)) {
      availableProductsMap.set(s.product.id, {
        ...s.product,
        stockQuantity: s.quantity
      })
    }
  })
  const availableProducts = Array.from(availableProductsMap.values())

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      <header>
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Sales Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Assigned Location: {warehouse.name} ({warehouse.type})</p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
        
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
        <ManualSupplyForm 
          sourceId={warehouseId} 
          destinations={[]} 
          products={availableProducts} 
        />

        <Card>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📦 Available Stock
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ paddingBottom: '0.75rem' }}>Product</th>
                <th style={{ paddingBottom: '0.75rem' }}>Price</th>
                <th style={{ paddingBottom: '0.75rem' }}>In Stock</th>
              </tr>
            </thead>
            <tbody>
              {warehouse.stocks.filter(s => s.quantity > 0).map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 500, color: 'var(--text-light)' }}>{s.product.name}</td>
                  <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>₦{s.product.sellingPrice.toLocaleString()}</td>
                  <td style={{ padding: '1rem 0', color: 'var(--text-light)' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                      color: 'var(--primary-color)',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      {s.quantity} units
                    </span>
                  </td>
                </tr>
              ))}
              {warehouse.stocks.filter(s => s.quantity > 0).length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No products available to sell.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  )
}
