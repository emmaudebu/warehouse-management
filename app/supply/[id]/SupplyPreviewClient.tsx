'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitTransfer, updateTransferDraft, cancelTransferDraft } from '@/app/actions/transfers'
import ConfirmModal from '@/components/ConfirmModal'
import SearchableProductDropdown from '@/components/SearchableProductDropdown'

export default function SupplyPreviewClient({ transfer, products, isFinalized = false }: { transfer: any, products: any[], isFinalized?: boolean }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [driverName, setDriverName] = useState(transfer.driverName || '')
  const [vehicleNum, setVehicleNum] = useState(transfer.vehicleNum || '')
  
  const [items, setItems] = useState(transfer.items.map((i: any) => ({
    id: i.id,
    productId: i.productId,
    quantity: i.quantity,
    batchNumber: i.batchNumber || ''
  })))

  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    const formData = new FormData()
    formData.append('transferId', transfer.id)
    formData.append('driverName', driverName)
    formData.append('vehicleNum', vehicleNum)
    formData.append('items', JSON.stringify(items))

    const res = await updateTransferDraft(formData)
    if (res?.error) {
      alert(res.error)
      setLoading(false)
      return
    }
    
    setIsEditing(false)
    setLoading(false)
    router.refresh()
  }

  const handleSubmit = async () => {
    setLoading(true)
    await submitTransfer(transfer.id)
    // Server action will redirect to /receipt/[id]
  }

  const handleCancel = async () => {
    setLoading(true)
    const res = await cancelTransferDraft(transfer.id)
    if (res?.error) alert(res.error)
    else router.push('/factory') // or wherever they came from
  }

  const addItem = () => {
    setItems([...items, { productId: products[0]?.id || '', quantity: 1, packageType: '', size: '', batchNumber: '' }])
  }

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items]
    if (field === 'productId') {
      newItems[index].productId = value
    } else if (field === 'packageType') {
      newItems[index].packageType = value
    } else if (field === 'size') {
      newItems[index].size = value
    } else if (field === 'quantity') {
      newItems[index].quantity = parseInt(value) || 0
    } else if (field === 'batchNumber') {
      newItems[index].batchNumber = value
    }
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_: any, i: number) => i !== index))
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-light)' }}>
          Supply Order Details 
          {!isFinalized && <span style={{ color: 'var(--warning-color)', fontSize: '1rem', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', border: '1px solid var(--warning-color)', marginLeft: '1rem' }}>DRAFT</span>}
        </h2>
        
        {!isFinalized && (
          <div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)} 
                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-light)', cursor: 'pointer', marginRight: '0.5rem' }}
                disabled={loading}
              >
                ✏️ Edit Order
              </button>
            )}
            <button 
              onClick={handleCancel} 
              style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}
              disabled={loading}
            >
              Cancel Draft
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>From</h4>
          <p style={{ fontWeight: 600 }}>{transfer.source.name}</p>
        </div>
        <div>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>To</h4>
          <p style={{ fontWeight: 600 }}>{transfer.destination.name}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem', marginBottom: '2rem', backgroundColor: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '0.5rem' }}>
        <div>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Delivery Person</h4>
          {isEditing ? (
            <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} style={inputStyle} />
          ) : (
            <p style={{ fontWeight: 500 }}>{driverName}</p>
          )}
        </div>
        <div>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Phone Number</h4>
          {isEditing ? (
            <input type="text" value={vehicleNum} onChange={e => setVehicleNum(e.target.value)} style={inputStyle} />
          ) : (
            <p style={{ fontWeight: 500 }}>{vehicleNum}</p>
          )}
        </div>
      </div>

      <h3 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>Items</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
            <th style={{ padding: '1rem 0' }}>Product</th>
            <th style={{ padding: '1rem 0' }}>Size / Package</th>
            <th style={{ padding: '1rem 0' }}>Quantity</th>
            {isEditing && <th></th>}
          </tr>
        </thead>
        <tbody>
          {isEditing ? (
            items.map((item: any, index: number) => {
              return (
                <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.5rem 0' }}>
                    <SearchableProductDropdown 
                      products={products}
                      value={item.productId}
                      onChange={(val) => updateItem(index, 'productId', val)}
                      placeholder="Select product..."
                    />
                  </td>
                  <td style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select value={item.size || ''} onChange={e => updateItem(index, 'size', e.target.value)} style={{...inputStyle, width: '100px'}}>
                      <option value="">Size</option>
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Big">Big</option>
                      <option value="Large">Large</option>
                    </select>
                    <select value={item.packageType || ''} onChange={e => updateItem(index, 'packageType', e.target.value)} style={{...inputStyle, width: '120px'}}>
                      <option value="">Package</option>
                      <option value="Pack">Pack</option>
                      <option value="Half Pack">Half Pack</option>
                      <option value="Carton">Carton</option>
                    </select>
                  </td>
                  <td style={{ padding: '0.5rem 0' }}>
                    <input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} style={{...inputStyle, width: '100px'}} min="1" />
                  </td>
                  <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(index)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}>✖</button>
                    )}
                  </td>
                </tr>
              )
            })
          ) : (
            transfer.items.map((item: any) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem 0', fontWeight: 500 }}>{item.product.name}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>
                  {item.size ? `Size: ${item.size}` : ''} {item.packageType ? `(${item.packageType})` : ''}
                  {!item.size && !item.packageType && '-'}
                </td>
                <td style={{ padding: '1rem 0' }}>
                  {item.quantity} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.product.unit}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isEditing && (
        <button onClick={addItem} style={{ backgroundColor: 'transparent', color: 'var(--primary-color)', border: '1px dashed var(--primary-color)', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', marginBottom: '2rem' }}>
          + Add Item
        </button>
      )}

      {isEditing && !isFinalized ? (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleUpdate} className="btn btn-primary" style={{ flex: 1, padding: '1rem' }} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            Discard Changes
          </button>
        </div>
      ) : !isFinalized ? (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleSubmit} className="btn btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }} disabled={loading}>
            {loading ? 'Submitting...' : 'Confirm & Submit Order 🚀'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => router.back()} className="btn" style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            Go Back
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Draft"
        message="Are you sure you want to cancel this draft? All progress will be deleted and this action cannot be undone."
        confirmText="Cancel Draft"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  )
}

const inputStyle = {
  padding: '0.75rem',
  borderRadius: '0.5rem',
  backgroundColor: 'var(--bg-color)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-light)',
  outline: 'none',
  width: '100%'
}
