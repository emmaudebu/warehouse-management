'use client'

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-primary hover-scale" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      🖨️ Print Invoice
    </button>
  )
}
