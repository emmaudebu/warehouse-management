'use client'

export default function WhatsAppButton({ phone, message, label = "Notify via WhatsApp" }: { phone: string, message: string, label?: string }) {
  const handleClick = () => {
    // Format phone (remove +, spaces, etc if needed, but WhatsApp wa.me handles standard formats well)
    const formattedPhone = phone.replace(/[^0-9]/g, '')
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <button onClick={handleClick} className="btn hover-scale" style={{
      backgroundColor: '#25D366',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(37, 211, 102, 0.4)'
    }}>
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
      </svg>
      {label}
    </button>
  )
}
