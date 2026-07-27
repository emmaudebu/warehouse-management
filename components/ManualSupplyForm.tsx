'use client'

import { useState, useEffect } from 'react'
import { initiateTransfer } from '@/app/actions/transfers'
import { getCustomers } from '@/app/actions/customers'
import SearchableProductDropdown from './SearchableProductDropdown'

import Card from './Card'

export default function ManualSupplyForm({ 
  sourceId, 
  destinations, 
  products 
}: { 
  sourceId: string, 
  destinations: { id: string, name: string }[],
  products: { id: string, name: string, category: { name: string }, sellingPrice?: number }[]
}) {
  const [items, setItems] = useState<any[]>([])
  const [draftItem, setDraftItem] = useState({ productId: '', quantity: 1, packageType: '', size: '' })
  const [destinationId, setDestinationId] = useState(destinations.length > 0 ? destinations[0].id : 'other')
  const [customers, setCustomers] = useState<{id: string, name: string, phone: string | null}[]>([])

  useEffect(() => {
    getCustomers().then(setCustomers)
  }, [])

  const addItem = () => {
    if (!draftItem.productId) {
      alert("Please select a product first.")
      return
    }
    setItems([...items, draftItem])
    setDraftItem({ productId: '', quantity: 1, packageType: '', size: '' })
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const editItem = (index: number) => {
    setDraftItem(items[index])
    removeItem(index)
  }

  const handleSubmit = async (formData: FormData) => {
    if (items.length === 0) {
      alert("Please add at least one product before submitting.")
      return
    }
    const res = await initiateTransfer(formData)
    if (res?.error) {
      alert(res.error)
    } else {
      setItems([])
      setDraftItem({ productId: '', quantity: 1, packageType: '', size: '' })
      alert("✅ Request submitted successfully!")
    }
  }

  return (
    <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', gridColumn: '1 / -1' }}>
      <input type="hidden" name="sourceId" value={sourceId} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div style={{ display: 'flex', gap: '2rem', width: '100%', flexWrap: 'wrap' }}>
        
        {/* Left Column: Customer and Destination Details & Draft Inputs */}
        <Card style={{ flex: '1 1 min(400px, 100%)', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {destinations.length === 0 ? '🛒 Make a Sale' : '🚚 Initiate Manual Supply'}
          </h3>
          {destinations.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Destination Warehouse</label>
              <select name="destinationId" required value={destinationId} onChange={e => setDestinationId(e.target.value)} style={inputStyle}>
                {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                <option value="other">Other (Type manually)</option>
              </select>
            </div>
          )}

          {/* For Salesperson (destinations empty) it defaults to 'other' under the hood */}
          {destinations.length === 0 && <input type="hidden" name="destinationId" value="other" />}

          {destinationId === 'other' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Customer Name (Custom Destination) 🏢</label>
                <input list="customer-names" type="text" name="customDestination" placeholder="e.g. John Doe / Lagos Port" required style={inputStyle} />
                <datalist id="customer-names">
                  {customers.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Customer Phone Number 📞</label>
                <input list="customer-phones" type="text" name="customDestinationPhone" placeholder="e.g. 08012345678" style={inputStyle} />
                <datalist id="customer-phones">
                  {customers.map(c => c.phone && <option key={`phone-${c.id}`} value={c.phone} />)}
                </datalist>
              </div>
            </>
          )}

          {destinations.length > 0 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Delivery Person 🧑‍✈️</label>
                <input type="text" name="driverName" placeholder="e.g. John Doe" required style={inputStyle} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Phone Number 📱</label>
                <input type="text" name="vehicleNum" placeholder="e.g. 08012345678" required style={inputStyle} />
              </div>
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: 600 }}>Select Product to Add</label>
            
            <SearchableProductDropdown 
              products={products}
              value={draftItem.productId}
              onChange={(val) => setDraftItem({...draftItem, productId: val})}
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="number" 
                value={draftItem.quantity || ''}
                onChange={(e) => setDraftItem({...draftItem, quantity: parseInt(e.target.value) || 0})}
                placeholder="Qty" 
                min="1"
                style={{...inputStyle, flex: 1}} 
              />
              
              <select
                value={draftItem.size || ''}
                onChange={(e) => setDraftItem({...draftItem, size: e.target.value})}
                style={{...inputStyle, flex: 1}}
              >
                <option value="">Size</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Big">Big</option>
                <option value="Large">Large</option>
              </select>
              
              <select
                value={draftItem.packageType || ''}
                onChange={(e) => setDraftItem({...draftItem, packageType: e.target.value})}
                style={{...inputStyle, flex: 1}}
              >
                <option value="">Package</option>
                <option value="Pack">Pack</option>
                <option value="Half Pack">Half Pack</option>
                <option value="Carton">Carton</option>
              </select>
            </div>
            
            <button 
              type="button" 
              onClick={addItem}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--primary-color)',
                border: '1px solid var(--primary-color)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                marginTop: '0.5rem'
              }}
            >
              + Add Product
            </button>
          </div>

          <button className="btn btn-primary" type="submit" style={{ padding: '1rem', fontSize: '1rem', borderRadius: '0.75rem', marginTop: '1rem' }}>
            {destinations.length === 0 ? 'Generate Receipt & Submit Sale 🧾' : 'Generate Invoice & Dispatch Supply 🚚'}
          </button>
        </Card>

        {/* Right Column: Products to Supply Out */}
        <Card style={{ flex: '1 1 min(400px, 100%)', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--border-color)' }}>
          <h4 style={{ margin: 0, color: 'var(--text-light)', fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📦 Products to Supply Out
          </h4>
          
          {items.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-dark)', borderRadius: '0.5rem', border: '1px dashed var(--border-color)' }}>
              No products added yet. Use the form on the left to add items.
            </div>
          )}

          {items.map((item, index) => {
            const productInfo = products.find(p => p.id === item.productId)
            const price = productInfo?.sellingPrice || 0
            
            return (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <div>
                  <h5 style={{ margin: 0, color: 'var(--text-light)', fontSize: '1rem' }}>{productInfo?.name}</h5>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>₦{price.toLocaleString()}</span> • Qty: {item.quantity} {item.size && `• Size: ${item.size}`} {item.packageType && `• Pkg: ${item.packageType}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => editItem(index)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Edit">✏️</button>
                  <button type="button" onClick={() => removeItem(index)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Remove">❌</button>
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </form>
  )
}

const inputStyle = {
  padding: '0.875rem',
  borderRadius: '0.75rem',
  backgroundColor: 'var(--bg-dark)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-light)',
  outline: 'none',
  width: '100%',
  transition: 'all 0.2s'
}
