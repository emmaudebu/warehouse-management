import Card from '@/components/Card'
import prisma from '@/lib/prisma'
import StockPieChart from '@/components/charts/StockPieChart'
import ActivityLineChart from '@/components/charts/ActivityLineChart'
import ExportButtons from '@/components/ExportButtons'
import ExportCSVButton from '@/components/ExportCSVButton'
import InventoryTable from '@/components/InventoryTable'
import TransferHistory from '@/components/TransferHistory'
import LowStockAlerts from '@/components/LowStockAlerts'
import { auth } from '@/auth'

export default async function DirectorDashboard() {
  const session = await auth()
  const role = session?.user?.role
  const products = await prisma.product.findMany({ include: { category: true } })
  const totalProducts = products.length
  const categories = await prisma.category.findMany()
  
  const stocks = await prisma.stock.findMany({
    include: { warehouse: true, product: true }
  })

  const recentTransfers = await prisma.transfer.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { source: true, destination: true, customer: true, items: { include: { product: true } } }
  })

  let factoryStock = 0
  let marketStock = 0
  let supplierStock = 0

  stocks.forEach(stock => {
    if (stock.warehouse.type === 'FACTORY') factoryStock += stock.quantity
    if (stock.warehouse.type === 'MARKET') marketStock += stock.quantity
    if (stock.warehouse.type === 'SUPPLIER') supplierStock += stock.quantity
  })

  const globalStock = factoryStock + marketStock + supplierStock

  const pendingTransfers = await prisma.transfer.count({
    where: { status: 'PENDING' }
  })

  // Basic Revenue & Profit Calculation
  const externalSales = await prisma.transfer.findMany({
    where: { status: 'DELIVERED', destination: { type: 'EXTERNAL' } },
    include: { items: { include: { product: true } }, initiatedBy: true }
  })
  
  let totalRevenue = 0
  let totalCogs = 0

  const salesPerformance: Record<string, { name: string, totalSales: number }> = {}

  externalSales.forEach(sale => {
    let saleTotal = 0
    sale.items.forEach(item => {
      const revenue = (item.quantity * item.product.sellingPrice)
      saleTotal += revenue
      totalRevenue += revenue
      totalCogs += (item.quantity * item.product.costPrice)
    })

    if (sale.initiatedBy) {
      if (!salesPerformance[sale.initiatedById]) {
        salesPerformance[sale.initiatedById] = { name: sale.initiatedBy.name, totalSales: 0 }
      }
      salesPerformance[sale.initiatedById].totalSales += saleTotal
    }
  })

  const performanceList = Object.values(salesPerformance).sort((a, b) => b.totalSales - a.totalSales)

  // Supplier Performance Calculation
  const supplierTransfers = await prisma.transfer.findMany({
    where: { status: 'DELIVERED', source: { type: 'SUPPLIER' } },
    include: { items: { include: { product: true } }, initiatedBy: true }
  })

  const supplierPerformance: Record<string, { name: string, totalValue: number }> = {}

  supplierTransfers.forEach(transfer => {
    let transferTotal = 0
    transfer.items.forEach(item => {
      transferTotal += (item.quantity * item.product.costPrice)
    })

    if (transfer.initiatedBy) {
      if (!supplierPerformance[transfer.initiatedById]) {
        supplierPerformance[transfer.initiatedById] = { name: transfer.initiatedBy.name, totalValue: 0 }
      }
      supplierPerformance[transfer.initiatedById].totalValue += transferTotal
    }
  })

  const supplierPerformanceList = Object.values(supplierPerformance).sort((a, b) => b.totalValue - a.totalValue)

  const expenses = await prisma.expense.findMany()
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  const netProfit = totalRevenue - totalCogs - totalExpenses

  // Format Data for Pie Chart
  const pieData = [
    { name: 'Factory', value: factoryStock },
    { name: 'Market', value: marketStock },
    { name: 'Supplier', value: supplierStock }
  ].filter(d => d.value > 0)

  // Format Mock Data for Area Chart (combining historical trend with current reality)
  // In a real app, this would be an aggregation of past months.
  const activityData = [
    { name: 'Jan', production: 4000, delivery: 2400 },
    { name: 'Feb', production: 3000, delivery: 1398 },
    { name: 'Mar', production: 2000, delivery: 9800 },
    { name: 'Apr', production: 2780, delivery: 3908 },
    { name: 'May', production: 1890, delivery: 4800 },
    { name: 'Jun', production: 2390, delivery: 3800 },
    { name: 'Jul', production: factoryStock + 1000, delivery: marketStock + supplierStock },
  ]

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <header id="overview" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Director Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>High-level overview of global operations.</p>
        </div>
        <ExportButtons transfers={recentTransfers} />
      </header>

      {/* KPI Summary Cards */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Financial KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <DashboardMetric title="Total Revenue" value={`₦${totalRevenue.toLocaleString()}`} change="From external sales" />
          <DashboardMetric title="Total Expenses" value={`₦${totalExpenses.toLocaleString()}`} change="Overhead costs" />
          <DashboardMetric title="Net Profit" value={`₦${netProfit.toLocaleString()}`} change="Revenue - COGS - Expenses" />
        </div>

        {/* Operational KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <DashboardMetric title="Global Stock" value={globalStock.toLocaleString()} change="Total across all locations" />
          <DashboardMetric title="Products Tracked" value={totalProducts.toString()} change="Active catalog" />
          <DashboardMetric title="Factory Holdings" value={factoryStock.toLocaleString()} change={`${((factoryStock/globalStock)*100 || 0).toFixed(1)}% of total`} />
          <DashboardMetric title="Market Holdings" value={marketStock.toLocaleString()} change={`${((marketStock/globalStock)*100 || 0).toFixed(1)}% of total`} />
        </div>
        
        <LowStockAlerts />
      </section>

      {/* Charts & Tracking Section */}
      <section id="actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Stock Distribution</h3>
          <StockPieChart data={pieData} />
        </Card>

        <Card>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏆 Sales Performance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {performanceList.length > 0 ? performanceList.map((p, index) => (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}
                  </span>
                  <span style={{ fontWeight: 500, color: 'var(--text-light)' }}>{p.name}</span>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  ₦{p.totalSales.toLocaleString()}
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No sales recorded yet.</div>
            )}
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏗️ Supplier Performance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {supplierPerformanceList.length > 0 ? supplierPerformanceList.map((p, index) => (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>
                    {index === 0 ? '⭐' : '🏭'}
                  </span>
                  <span style={{ fontWeight: 500, color: 'var(--text-light)' }}>{p.name}</span>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>
                  ₦{p.totalValue.toLocaleString()}
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No supplies recorded yet.</div>
            )}
          </div>
        </Card>
      </section>

      <section id="inventory">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>Global Inventory (All Locations)</h2>
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
            filename="global_products_export" 
          />
        </div>
        <InventoryTable stocks={stocks} categories={categories} showLocation={true} role={role} />
      </section>

      {/* Activity Logs Section */}
      <section id="history">
        <TransferHistory />
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

function ActivityRow({ reference, product, warehouse, date, status }: { reference: string, product: string, warehouse: string, date: string, status: string }) {
  const isCompleted = status === 'DELIVERED'
  return (
    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
      <td style={{ padding: '1rem 0', fontWeight: 600 }}>{reference}</td>
      <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{product}</td>
      <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{warehouse}</td>
      <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{date}</td>
      <td style={{ padding: '1rem 0' }}>
        <span style={{
          backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          color: isCompleted ? 'var(--success-color)' : 'var(--warning-color)',
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {status}
        </span>
      </td>
    </tr>
  )
}
