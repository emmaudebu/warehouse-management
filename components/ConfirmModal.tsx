'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true
}: ConfirmModalProps) {

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden' // Prevent background scrolling
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onCancel])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '2rem',
        borderRadius: '1rem',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-color)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          color: 'var(--text-light)',
          fontSize: '1.25rem',
          fontWeight: 600
        }}>
          {title}
        </h3>
        
        <p style={{ 
          margin: '0 0 2rem 0', 
          color: 'var(--text-muted)',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        <div style={{ 
          display: 'flex', 
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'transparent',
              color: 'var(--text-light)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dark)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm()
              onCancel() // close modal on confirm usually, or handled by parent
            }}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              backgroundColor: isDestructive ? '#ef4444' : 'var(--primary-color)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              boxShadow: isDestructive ? '0 4px 14px 0 rgba(239, 68, 68, 0.39)' : '0 4px 14px 0 rgba(0, 118, 255, 0.39)',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
