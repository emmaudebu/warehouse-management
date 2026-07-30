'use client'

import { useState, useEffect } from 'react'
import { getTransfers } from '@/app/actions/transfers'
import Card from './Card'
import ExportCSVButton from './ExportCSVButton'
import TransferActionButtons from './TransferActionButtons'

export default function TransferHistory({ warehouseId, userId, limit = 6, hideActions = false }: { warehouseId?: string, userId?: string, limit?: number, hideActions?: boolean }) {
  const [transfers, setTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('date') // 'date' or 'location'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await getTransfers({ warehouseId, userId, page, limit, sortBy, startDate, endDate })
        setTransfers(res.transfers)
        setTotalPages(res.totalPages)
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    loadData()
  }, [warehouseId, userId, page, limit, sortBy, startDate, endDate, refreshKey])

  const exportData = transfers.map(t => ({
    'Date': new Date(t.createdAt).toLocaleString(),
    'Transfer ID': t.id,
    'Source': t.source?.name || 'Unknown',
    'Destination': t.destination?.name || 'Unknown',
    'Status': t.status,
    'Vehicle': t.vehicleNum || 'N/A',
    'Driver': t.driverName || 'N/A',
    'Total Items': t.items.length
  }))

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 className="text-gradient" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>📜 Recent Supply Activity</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <ExportCSVButton data={exportData} filename="transfer_history" />
          
          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-dark)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              style={{ backgroundColor: 'transparent', color: 'var(--text-light)', border: 'none', outline: 'none', padding: '0.25rem', fontSize: '0.875rem' }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              style={{ backgroundColor: 'transparent', color: 'var(--text-light)', border: 'none', outline: 'none', padding: '0.25rem', fontSize: '0.875rem' }}
            />
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
                style={{ padding: '0.25rem 0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sort by:</label>
            <select 
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-light)',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            >
              <option value="date">Date (Newest First)</option>
              <option value="location">Destination Location</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : transfers.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent supplies found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {transfers.map(t => {
            const itemCount = t.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
            const isOutgoing = warehouseId ? t.sourceId === warehouseId : false
            
            return (
              <div key={`transfer-${t.id}`} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: '0.75rem',
                backgroundColor: 'rgba(0,0,0,0.02)',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.25rem' }}>
                    {t.reference}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {isOutgoing ? 'Sent to' : 'From'}: <span style={{ fontWeight: 500, color: 'var(--primary-color)' }}>
                      {isOutgoing ? (t.customer?.name || t.destination.name) : t.source.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    By {t.initiatedBy.name} • Delivery Person: {t.driverName}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: t.status === 'DELIVERED' ? 'rgba(56, 161, 105, 0.1)' : 'rgba(221, 107, 32, 0.1)',
                    color: t.status === 'DELIVERED' ? 'var(--success-color)' : 'var(--warning-color)',
                    marginBottom: '0.5rem'
                  }}>
                    {t.status}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {itemCount} Items
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {t.status === 'PENDING' && !hideActions && warehouseId && (
                      <TransferActionButtons 
                        transferId={t.id} 
                        mode={isOutgoing ? 'SENDER' : 'RECEIVER'} 
                        onSuccess={() => setRefreshKey(prev => prev + 1)}
                      />
                    )}
                    <a href={t.status === 'DRAFT' ? `/supply/${t.id}` : `/invoice/${t.id}`} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.4rem 1rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--primary-color)',
                      color: 'white',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      transition: 'opacity 0.2s'
                    }}>
                      {t.status === 'DRAFT' ? 'Review Draft' : (t.destination.type === 'EXTERNAL' ? 'View Receipt' : 'View Invoice')}
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  color: page === 1 ? 'var(--text-muted)' : 'var(--primary-color)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Previous
              </button>
              
              <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: 600 }}>
                Page {page} of {totalPages}
              </span>
              
              <button 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  color: page === totalPages ? 'var(--text-muted)' : 'var(--primary-color)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
