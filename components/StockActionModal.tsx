'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { adjustStock, processReturn } from '@/app/actions/inventory'

export default function StockActionModal({ 
  stockId, 
  productName,
  currentQuantity,
  actionType, // 'ADJUST' or 'RETURN'
  onClose
}: { 
  stockId: string, 
  productName: string, 
  currentQuantity: number,
  actionType: 'ADJUST' | 'RETURN',
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (quantity === 0) return alert('Quantity must be greater than 0 (or negative for adjustment)')
    
    setLoading(true)
    let res
    if (actionType === 'ADJUST') {
      res = await adjustStock(stockId, quantity, reason || 'Manual adjustment')
    } else {
      if (quantity <= 0) {
        setLoading(false)
        return alert('Return quantity must be greater than 0')
      }
      res = await processReturn(stockId, quantity, reason || 'Customer return')
    }

    setLoading(false)
    if (res?.error) {
      alert(res.error)
    } else {
      onClose()
    }
  }

  if (!mounted) return null

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
    }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
          {actionType === 'ADJUST' ? '⚖️ Adjust Stock' : '↩️ Process Return'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Product: <strong style={{ color: 'var(--text-light)' }}>{productName}</strong><br/>
          Current Stock: <strong style={{ color: 'var(--primary-color)' }}>{currentQuantity}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {actionType === 'ADJUST' ? 'Adjustment Quantity (Use negative for loss/damage)' : 'Return Quantity'}
            </label>
            <input 
              type="number" 
              required
              min={actionType === 'ADJUST' ? undefined : "1"}
              value={quantity || ''} 
              onChange={e => setQuantity(parseInt(e.target.value) || 0)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.5rem', 
                backgroundColor: 'var(--bg-darker)', border: '1px solid var(--border-color)', color: 'var(--text-light)', outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Reason / Notes
            </label>
            <textarea 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              placeholder={actionType === 'ADJUST' ? 'e.g., Found 2 broken bottles during audit' : 'e.g., Customer returned due to wrong order'}
              rows={3}
              required
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.5rem', 
                backgroundColor: 'var(--bg-darker)', border: '1px solid var(--border-color)', color: 'var(--text-light)', outline: 'none', resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} disabled={loading} style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', 
              backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer'
            }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}>
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
