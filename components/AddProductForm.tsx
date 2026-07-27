'use client'

import { addProduct } from '@/app/actions/products'
import { useRef } from 'react'

export default function AddProductForm({ categories }: { categories: { id: string, name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (formData: FormData) => {
    const result = await addProduct(formData)
    
    if (result?.error) {
      alert(result.error) // Pop up alert if product already exists
    } else {
      alert("Product added successfully!")
      formRef.current?.reset()
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Product Name</label>
        <input type="text" name="name" placeholder="e.g. Lavender Body Lotion" required style={inputStyle} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Category</label>
        <select name="categoryId" required style={inputStyle}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Size</label>
        <select name="size" style={inputStyle}>
          <option value="">None</option>
          <option value="Small">Small</option>
          <option value="Medium">Medium</option>
          <option value="Big">Big</option>
          <option value="Large">Large</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Quantity</label>
        <input type="number" name="quantity" defaultValue="0" min="0" required style={inputStyle} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Unit (Package)</label>
        <select name="unit" style={inputStyle}>
          <option value="Quantity">Quantity (Default)</option>
          <option value="Pieces">Pieces</option>
          <option value="Pack">Pack</option>
          <option value="Half Pack">Half Pack</option>
          <option value="Carton">Carton</option>
        </select>
        <input type="hidden" name="measurement" value="" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Selling Price</label>
        <input type="number" name="sellingPrice" defaultValue="0" min="0" step="0.01" required style={inputStyle} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Low Stock Alert Threshold</label>
        <input type="number" name="lowStockThreshold" placeholder="Global default if blank" min="0" style={inputStyle} />
      </div>
      
      <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
        <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
          Add Product to Catalog ✨
        </button>
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
  width: '100%'
}
