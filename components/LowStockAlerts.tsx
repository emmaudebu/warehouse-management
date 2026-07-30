import prisma from '@/lib/prisma'

export default async function LowStockAlerts({ warehouseId }: { warehouseId?: string }) {
  const settings = await prisma.companySettings.findFirst()
  const threshold = settings?.globalLowStockThreshold || 50

  let lowStocksRaw: any[] = []
  
  if (warehouseId) {
    lowStocksRaw = await prisma.$queryRaw`
      SELECT s.id, s.quantity, p.name as "productName", w.name as "warehouseName" 
      FROM "Stock" s 
      JOIN "Product" p ON s."productId" = p.id
      JOIN "Warehouse" w ON s."warehouseId" = w.id
      WHERE s."warehouseId" = ${warehouseId}
        AND s.quantity <= COALESCE(p."lowStockThreshold", ${threshold})
      ORDER BY s.quantity ASC
      LIMIT 10
    `
  } else {
    lowStocksRaw = await prisma.$queryRaw`
      SELECT s.id, s.quantity, p.name as "productName", w.name as "warehouseName" 
      FROM "Stock" s 
      JOIN "Product" p ON s."productId" = p.id
      JOIN "Warehouse" w ON s."warehouseId" = w.id
      WHERE s.quantity <= COALESCE(p."lowStockThreshold", ${threshold})
      ORDER BY s.quantity ASC
      LIMIT 10
    `
  }

  if (lowStocksRaw.length === 0) return null

  return (
    <div className="marquee-container">
      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', display: 'flex', alignItems: 'center', padding: '0 1.25rem', backgroundColor: 'var(--bg-darker)', color: 'var(--danger-color)', fontWeight: 700, zIndex: 10, borderRight: '1px solid rgba(229, 62, 62, 0.2)', boxShadow: '8px 0 12px 0 var(--bg-darker)' }}>
        <span style={{ fontSize: '1.1rem', marginRight: '0.5rem' }}>⚠️</span> <span style={{ whiteSpace: 'nowrap' }}>LOW STOCK:</span>
      </div>
      <div className="marquee-content">
        {lowStocksRaw.map(stock => (
          <span key={stock.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>{stock.productName}</span>
            {!warehouseId && <span style={{ color: 'var(--danger-color)', opacity: 0.8, fontSize: '0.875rem' }}>({stock.warehouseName})</span>}
            <span style={{ 
              fontWeight: 700, 
              color: 'var(--danger-color)',
              backgroundColor: 'rgba(229, 62, 62, 0.1)',
              padding: '0.1rem 0.5rem',
              borderRadius: '999px',
              fontSize: '0.875rem'
            }}>
              {stock.quantity} left
            </span>
            <span style={{ color: 'rgba(229, 62, 62, 0.3)', margin: '0 0.5rem' }}>•</span>
          </span>
        ))}
      </div>
    </div>
  )
}
