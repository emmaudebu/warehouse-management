'use client'

import { useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import ConfirmModal from './ConfirmModal'
import { getOrCreateConversation, sendMessage } from '@/app/actions/chat'

export default function ExportAndShareMenu({ 
  targetId, 
  fileName,
  users,
  waMessage
}: { 
  targetId: string, 
  fileName: string,
  users: { id: string, name: string, phone: string | null }[],
  waMessage: string
}) {
  const [loading, setLoading] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showInternalMenu, setShowInternalMenu] = useState(false)
  const [showWaConfirm, setShowWaConfirm] = useState(false)
  const [pendingPhone, setPendingPhone] = useState<string | null>(null)

  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  const downloadJPEG = async () => {
    setLoading(true)
    const element = document.getElementById(targetId)
    if (!element) return setLoading(false)
    
    try {
      const canvas = await html2canvas(element, { scale: 2 })
      const link = document.createElement('a')
      link.download = `${fileName}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.9)
      link.click()
    } catch (err) {
      console.error(err)
      showToast('Failed to generate JPEG', 'error')
    }
    setLoading(false)
  }

  const generatePDF = async () => {
    const element = document.getElementById(targetId)
    if (!element) throw new Error('Element not found')
    
    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    return pdf
  }

  const downloadPDF = async () => {
    setLoading(true)
    try {
      const pdf = await generatePDF()
      pdf.save(`${fileName}.pdf`)
    } catch (err) {
      console.error(err)
      showToast('Failed to generate PDF', 'error')
    }
    setLoading(false)
  }

  const handleShareWhatsApp = (phone: string | null) => {
    if (!phone) {
      showToast('This user does not have a registered phone number.', 'error')
      return
    }
    
    setPendingPhone(phone)
    setShowWaConfirm(true)
  }

  const proceedWhatsAppShare = async () => {
    if (!pendingPhone) return
    await downloadPDF()
    // Remove any non-numeric characters from phone
    const cleanPhone = pendingPhone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`, '_blank')
    setPendingPhone(null)
    setShowWaConfirm(false)
  }

  const handleShareInternal = async (userId: string, userName: string) => {
    setLoading(true)
    try {
      const convId = await getOrCreateConversation(userId)
      const url = window.location.href
      await sendMessage(convId, `Hello! Please view this document: ${url}`)
      showToast(`Document shared with ${userName} via internal chat!`)
      setShowInternalMenu(false)
    } catch (err) {
      console.error(err)
      showToast('Failed to send internal message', 'error')
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={downloadPDF} 
          disabled={loading}
          style={buttonStyle}
        >
          📄 Download PDF
        </button>
        
        <button 
          onClick={downloadJPEG} 
          disabled={loading}
          style={buttonStyle}
        >
          🖼️ Download JPEG
        </button>
        
        <button 
          onClick={() => { setShowShareMenu(!showShareMenu); setShowInternalMenu(false); }} 
          disabled={loading}
          style={{...buttonStyle, backgroundColor: '#25D366', color: 'white', borderColor: '#25D366'}}
        >
          💬 Share via WhatsApp ▼
        </button>

        <button 
          onClick={() => { setShowInternalMenu(!showInternalMenu); setShowShareMenu(false); }} 
          disabled={loading}
          style={{...buttonStyle, backgroundColor: 'var(--primary-color)', color: 'white', borderColor: 'var(--primary-color)'}}
        >
          ✉️ Share Internally ▼
        </button>
      </div>

      {showShareMenu && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
          minWidth: '200px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', padding: '0 0.5rem' }}>Select recipient for WhatsApp:</div>
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => {
                handleShareWhatsApp(u.phone)
                setShowShareMenu(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-light)',
                cursor: 'pointer',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dark)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {u.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{u.phone ? `(${u.phone})` : '(No phone)'}</span>
            </button>
          ))}
          
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>
          
          <button
            onClick={() => {
              const num = prompt('Enter WhatsApp Number (with country code, e.g. +234...)')
              if (num) handleShareWhatsApp(num)
              setShowShareMenu(false)
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '0.5rem',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--primary-color)',
              cursor: 'pointer',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Enter Custom Number...
          </button>
        </div>
      )}

      {showInternalMenu && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
          minWidth: '200px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', padding: '0 0.5rem' }}>Select internal staff:</div>
          {users.map(u => (
            <button
              key={`internal-${u.id}`}
              onClick={() => handleShareInternal(u.id, u.name)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-light)',
                cursor: 'pointer',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dark)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span>{u.name}</span>
              {/* @ts-ignore */}
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{u.role ? u.role.replace('_', ' ') : ''}</span>
            </button>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={showWaConfirm}
        title="Share via WhatsApp"
        message="A PDF will be downloaded to your device. Please attach it manually in the WhatsApp chat that opens."
        confirmText="Download & Open WhatsApp"
        onConfirm={proceedWhatsAppShare}
        onCancel={() => {
          setShowWaConfirm(false)
          setPendingPhone(null)
        }}
        isDestructive={false}
      />

      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: toastMessage.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '999px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 99999,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {toastMessage.type === 'success' ? '✅' : '❌'} {toastMessage.text}
        </div>
      )}
    </div>
  )
}

const buttonStyle = {
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  backgroundColor: 'var(--bg-dark)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-light)',
  cursor: 'pointer',
  fontWeight: 600,
  transition: 'all 0.2s'
}
