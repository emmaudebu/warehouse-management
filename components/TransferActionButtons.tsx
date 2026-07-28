'use client'

import { useState } from 'react'
import { receiveTransfer, rejectTransfer, cancelSubmittedTransfer } from '@/app/actions/transfers'

interface Props {
  transferId: string;
  mode: 'RECEIVER' | 'SENDER';
  // RECEIVER = Can Accept or Decline
  // SENDER = Can Cancel
}

export default function TransferActionButtons({ transferId, mode }: Props) {
  const [loading, setLoading] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  const handleAccept = async () => {
    setLoading(true)
    try {
      await receiveTransfer(transferId)
    } catch (err: any) {
      alert(err.message || 'Failed to accept supply')
      setLoading(false)
    }
  }

  const handleDeclineSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining.')
      return
    }
    setLoading(true)
    try {
      const res = await rejectTransfer(transferId, declineReason)
      if (res.error) {
        alert(res.error)
        setLoading(false)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to decline supply')
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this pending supply? The stock will be returned to your inventory.')) return
    
    setLoading(true)
    try {
      const res = await cancelSubmittedTransfer(transferId)
      if (res.error) {
        alert(res.error)
        setLoading(false)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel supply')
      setLoading(false)
    }
  }

  if (mode === 'SENDER') {
    return (
      <button 
        onClick={handleCancel}
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: '0.875rem',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Cancelling...' : 'Cancel Supply ❌'}
      </button>
    )
  }

  // RECEIVER MODE
  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={handleAccept}
          disabled={loading}
          style={{
            flex: 1,
            minWidth: '120px',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--success-color)',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '...' : 'Accept ✅'}
        </button>
        
        <button 
          onClick={() => setShowDeclineModal(true)}
          disabled={loading}
          style={{
            flex: 1,
            minWidth: '120px',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'transparent',
            color: '#ef4444',
            border: '1px solid #ef4444',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            opacity: loading ? 0.7 : 1
          }}
        >
          Decline ❌
        </button>
      </div>

      {showDeclineModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: '1rem',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--glass-shadow)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-light)' }}>Decline Supply</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Please provide a reason for declining this supply. This will be logged and the sender will be notified.
            </p>
            
            <form onSubmit={handleDeclineSubmit}>
              <textarea 
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Items were damaged during transit..."
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-light)',
                  outline: 'none',
                  marginBottom: '1.5rem',
                  resize: 'none'
                }}
              />
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowDeclineModal(false)}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {loading ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
