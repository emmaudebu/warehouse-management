import InventoryTable from '@/components/InventoryTable'
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

  const categories = await prisma.category.findMany()

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

      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Pending Deliveries */}
        {pendingTransfers.length > 0 && (
          <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🚚 Incoming Supplies</h3>
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
          </Card>
        )}

        <ManualSupplyForm 
          sourceId={warehouseId} 
          destinations={[]} 
          products={availableProducts} 
        />
      </section>
      
      <section>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📦 Available Stock
        </h3>
        <InventoryTable 
          stocks={warehouse.stocks} 
          categories={categories} 
          role="SALESPERSON" 
        />
      </section>
    </div>
  )
}
