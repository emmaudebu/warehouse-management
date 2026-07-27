'use client'

import { deleteUser, toggleUserStatus } from '@/app/actions/admin'
import { useState } from 'react'

import ConfirmModal from './ConfirmModal'

export default function UserActionButtons({ userId, currentStatus }: { userId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const [showToggleModal, setShowToggleModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  const handleToggle = async () => {
    setLoading(true)
    await toggleUserStatus(userId, currentStatus)
    setLoading(false)
  }

  const handleDelete = async () => {
    setLoading(true)
    const res = await deleteUser(userId)
    if (res?.error) {
      setErrorToast(res.error)
      setTimeout(() => setErrorToast(null), 4000)
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => setShowToggleModal(true)} 
          disabled={loading}
          style={{ 
            padding: '0.25rem 0.75rem', 
            borderRadius: '0.25rem', 
            border: 'none',
            backgroundColor: currentStatus === 'ACTIVE' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: currentStatus === 'ACTIVE' ? 'var(--warning-color)' : 'var(--success-color)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.75rem'
          }}
        >
          {currentStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
        </button>

        <button 
          onClick={() => setShowDeleteModal(true)}
          disabled={loading}
          style={{ 
            padding: '0.25rem 0.75rem', 
            borderRadius: '0.25rem', 
            border: 'none',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.75rem'
          }}
        >
          Delete
        </button>
      </div>

      {errorToast && (
        <div className="animate-fade-in" style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--danger-color)',
          color: 'var(--danger-color)',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          boxShadow: 'var(--glass-shadow)',
          zIndex: 50,
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}>
          {errorToast}
        </div>
      )}

      <ConfirmModal
        isOpen={showToggleModal}
        title={currentStatus === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
        message={`Are you sure you want to ${currentStatus === 'ACTIVE' ? 'suspend' : 'activate'} this account?`}
        confirmText={currentStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
        onConfirm={handleToggle}
        onCancel={() => setShowToggleModal(false)}
        isDestructive={currentStatus === 'ACTIVE'}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Account"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
