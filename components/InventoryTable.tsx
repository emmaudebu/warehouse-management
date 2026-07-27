'use client'

import { useState } from 'react'
import { updateInventoryRow, deleteStock } from '@/app/actions/inventory'
import { initiateTransfer } from '@/app/actions/transfers'
import ConfirmModal from './ConfirmModal'

type Category = { id: string, name: string }
type Product = { id: string, name: string, categoryId: string, unit: string, sellingPrice: number, size?: string | null, measurement?: string | null }
type Stock = { id: string, quantity: number, totalReceived: number, totalSupplied: number, lastReceivedAt: Date | null, batchNumber: string | null, product: Product, warehouse?: { name: string } }
type Destination = { id: string, name: string }

export default function InventoryTable({ 
  stocks, 
  categories,
  showLocation = false,
  role,
  sourceWarehouseId,
  destinations = []
}: { 
  stocks: Stock[], 
  categories: Category[],
  showLocation?: boolean,
  role?: string,
  sourceWarehouseId?: string,
  destinations?: Destination[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [stockToDelete, setStockToDelete] = useState<string | null>(null)
  
  // Selection state for Supply Workflow
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([])
  const [supplyQuantities, setSupplyQuantities] = useState<Record<string, number>>({})
  const [supplyDestinationId, setSupplyDestinationId] = useState(destinations[0]?.id || '')

  // Sorting state
  const [sortBy, setSortBy] = useState('newest_delivery')

  const canEdit = role === 'DIRECTOR' || role === 'FACTORY_MANAGER'
  const canSupply = !!sourceWarehouseId

  const handleEdit = (stock: Stock) => {
    setEditingId(stock.id)
    setEditData({
      name: stock.product.name,
      categoryId: stock.product.categoryId,
      unit: stock.product.unit,
      size: stock.product.size || '',
      measurement: stock.product.measurement || '',
      sellingPrice: stock.product.sellingPrice || 0,
      quantity: stock.quantity
    })
  }

  const handleSave = async (stock: Stock) => {
    setLoading(true)
    try {
      const res = await updateInventoryRow(stock.product.id, stock.id, editData)
      if (res?.error) {
        alert(res.error)
      } else {
        setEditingId(null)
      }
    } catch (err) {
      alert('Failed to update inventory')
    }
    setLoading(false)
  }

  const handleDeleteStock = async () => {
    if (!stockToDelete) return
    setLoading(true)
    const res = await deleteStock(stockToDelete)
    if (res?.error) {
      alert(res.error)
    }
    setStockToDelete(null)
    setLoading(false)
  }

  const toggleSelection = (stock: Stock) => {
    if (selectedStockIds.includes(stock.id)) {
      setSelectedStockIds(selectedStockIds.filter(id => id !== stock.id))
      const newQs = {...supplyQuantities}
      delete newQs[stock.id]
      setSupplyQuantities(newQs)
    } else {
      setSelectedStockIds([...selectedStockIds, stock.id])
      setSupplyQuantities({...supplyQuantities, [stock.id]: 1})
    }
  }

  // Sort the stocks array before rendering
  const sortedStocks = [...stocks].sort((a, b) => {
    if (sortBy === 'newest_delivery') {
      return (new Date(b.lastReceivedAt || 0).getTime()) - (new Date(a.lastReceivedAt || 0).getTime())
    }
    if (sortBy === 'oldest_delivery') {
      return (new Date(a.lastReceivedAt || 0).getTime()) - (new Date(b.lastReceivedAt || 0).getTime())
    }
    if (sortBy === 'name') {
      return a.product.name.localeCompare(b.product.name)
    }
    if (sortBy === 'quantity') {
      return b.quantity - a.quantity
    }
    return 0
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Table Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sort Inventory:</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-light)',
              outline: 'none',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="newest_delivery">Latest Delivery Date</option>
            <option value="oldest_delivery">Oldest Delivery Date</option>
            <option value="name">Product Name (A-Z)</option>
            <option value="quantity">Highest Quantity</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)', backdropFilter: 'var(--glass-blur)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
              {canSupply && <th style={{ padding: '1rem', width: '50px' }}>📦</th>}
              <th style={{ padding: '1rem' }}>Product Name</th>
              <th style={{ padding: '1rem' }}>Category</th>
              <th style={{ padding: '1rem' }}>Size</th>
              <th style={{ padding: '1rem' }}>Package</th>
              <th style={{ padding: '1rem' }}>Selling Price</th>
              <th style={{ padding: '1rem' }}>Stock Available</th>
              {showLocation && <th style={{ padding: '1rem' }}>Location</th>}
              {canSupply && <th style={{ padding: '1rem' }}>Supply Qty</th>}
              {canEdit && <th style={{ padding: '1rem' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sortedStocks.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No inventory found.
                </td>
              </tr>
            ) : (
              sortedStocks.map(stock => {
                const isEditing = editingId === stock.id
                const isSelected = selectedStockIds.includes(stock.id)
                
                return (
                  <tr key={`stock-${stock.id}`} style={{ 
                    borderBottom: '1px solid var(--border-color)', 
                    transition: 'background-color 0.2s',
                    backgroundColor: isSelected ? 'rgba(224, 122, 95, 0.05)' : 'transparent'
                  }}>
                    {canSupply && (
                      <td style={{ padding: '1rem' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleSelection(stock)} 
                          style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                        />
                      </td>
                    )}
                    <td style={{ padding: '1rem' }}>
                      {isEditing ? (
                        <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} style={inputStyle} />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{stock.product.name}</span>
                      )}
                    </td>
                    
                    <td style={{ padding: '1rem' }}>
                      {isEditing ? (
                        <select value={editData.categoryId} onChange={(e) => setEditData({...editData, categoryId: e.target.value})} style={inputStyle}>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>{categories.find(c => c.id === stock.product.categoryId)?.name || 'Unknown'}</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {isEditing ? (
                        <select value={editData.size} onChange={(e) => setEditData({...editData, size: e.target.value})} style={inputStyle}>
                          <option value="">None</option>
                          <option value="Small">Small</option>
                          <option value="Medium">Medium</option>
                          <option value="Big">Big</option>
                          <option value="Large">Large</option>
                        </select>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>{stock.product.size || '-'}</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {isEditing ? (
                        <select value={editData.measurement} onChange={(e) => setEditData({...editData, measurement: e.target.value})} style={inputStyle}>
                          <option value="">None</option>
                          <option value="Pack">Pack</option>
                          <option value="Half Pack">Half Pack</option>
                          <option value="Carton">Carton</option>
                        </select>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>{stock.product.measurement || '-'}</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {isEditing ? (
                        <input type="number" value={Number.isNaN(editData.sellingPrice) ? '' : editData.sellingPrice} onChange={(e) => setEditData({...editData, sellingPrice: parseFloat(e.target.value)})} style={{...inputStyle, width: '100px'}} />
                      ) : (
                        <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>₦{stock.product.sellingPrice?.toLocaleString() || 0}</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {isEditing ? (
                        <input type="number" value={Number.isNaN(editData.quantity) ? '' : editData.quantity} onChange={(e) => setEditData({...editData, quantity: parseInt(e.target.value)})} style={{...inputStyle, width: '80px'}} />
                      ) : (
                        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{stock.quantity.toLocaleString()}</span>
                      )}
                    </td>

                    {showLocation && (
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        {stock.warehouse?.name || 'Unknown'}
                      </td>
                    )}

                    {canSupply && (
                      <td style={{ padding: '1rem' }}>
                        {isSelected ? (
                          <input 
                            type="number" 
                            min="1" 
                            max={stock.quantity}
                            value={Number.isNaN(supplyQuantities[stock.id]) ? '' : (supplyQuantities[stock.id] || 1)} 
                            onChange={(e) => setSupplyQuantities({...supplyQuantities, [stock.id]: parseInt(e.target.value)})} 
                            style={{...inputStyle, width: '80px', borderColor: 'var(--primary-color)'}} 
                          />
                        ) : (
                          <span style={{ color: 'var(--border-color)' }}>-</span>
                        )}
                      </td>
                    )}

                    {canEdit && (
                      <td style={{ padding: '1rem' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleSave(stock)} disabled={loading} style={btnSaveStyle}>
                              {loading ? '...' : 'Save'}
                            </button>
                            <button onClick={() => setEditingId(null)} style={btnCancelStyle}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleEdit(stock)} style={btnEditStyle}>Edit ✏️</button>
                            <button onClick={() => setStockToDelete(stock.id)} style={{...btnCancelStyle, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)'}}>Delete 🗑️</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic Supply Action Box */}
      {selectedStockIds.length > 0 && sourceWarehouseId && (
        <div style={{ 
          padding: '2rem', 
          backgroundColor: 'var(--bg-card)', 
          borderRadius: '1rem', 
          border: '2px solid var(--primary-color)',
          boxShadow: 'var(--glass-shadow)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚚 Supply Selected Items ({selectedStockIds.length})
          </h3>
          <form action={async (formData) => {
            const res = await initiateTransfer(formData)
            if (res?.error) alert(res.error)
          }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <input type="hidden" name="sourceId" value={sourceWarehouseId} />
            <input type="hidden" name="items" value={JSON.stringify(
              selectedStockIds.map(stockId => {
                const stock = stocks.find(s => s.id === stockId)
                return { productId: stock?.product.id, quantity: supplyQuantities[stockId] }
              })
            )} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: supplyDestinationId === 'other' ? '1 / -1' : 'auto' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Destination</label>
              <select name="destinationId" required value={supplyDestinationId} onChange={e => setSupplyDestinationId(e.target.value)} style={inputStyle}>
                {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                <option value="other">Other (Type manually)</option>
              </select>
            </div>

            {supplyDestinationId === 'other' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Enter Custom Destination 🏢</label>
                  <input type="text" name="customDestination" placeholder="e.g. Lagos Port External" required style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Destination Phone Number 📞</label>
                  <input type="text" name="customDestinationPhone" placeholder="e.g. 08012345678" style={inputStyle} />
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Delivery Person 🧑‍✈️</label>
              <input type="text" name="driverName" placeholder="John Doe" required style={inputStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Phone Number 📱</label>
              <input type="text" name="vehicleNum" placeholder="08012345678" required style={inputStyle} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                Confirm Supply & Generate Invoice 🧾
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        isOpen={!!stockToDelete}
        title="Delete Product Stock"
        message="Are you sure you want to delete this product stock? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteStock}
        onCancel={() => setStockToDelete(null)}
      />
    </div>
  )
}

const inputStyle = {
  padding: '0.75rem',
  borderRadius: '0.5rem',
  backgroundColor: 'var(--bg-dark)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-light)',
  outline: 'none',
  width: '100%',
  transition: 'all 0.2s'
}

const btnSaveStyle = {
  padding: '0.4rem 0.8rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'var(--success-color)', color: 'white', cursor: 'pointer', fontWeight: 600 
}
const btnCancelStyle = {
  padding: '0.4rem 0.8rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-light)', cursor: 'pointer' 
}
const btnEditStyle = {
  padding: '0.4rem 0.8rem', borderRadius: '0.5rem', border: '1px solid var(--primary-color)', backgroundColor: 'transparent', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' 
}
