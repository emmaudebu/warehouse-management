'use client'

import { useState } from 'react'

export default function SettingsUploader({ label, type, currentUrl }: { label: string, type: 'logo' | 'bg', currentUrl?: string }) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(currentUrl)
  const [msg, setMsg] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMsg('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const res = await fetch('/api/settings/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (data.success) {
        setPreview(data.url)
        setMsg('✅ Successfully Uploaded & Saved!')
        setTimeout(() => {
          setMsg('')
          window.location.reload()
        }, 1500)
      } else {
        setMsg(data.error || '❌ Upload failed')
      }
    } catch (err) {
      setMsg('❌ An error occurred')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, color: 'var(--text-light)', fontWeight: 600 }}>{label}</h4>
        {msg && <span style={{ fontSize: '0.8rem', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: '0.25rem', backgroundColor: msg.toLowerCase().includes('success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: msg.toLowerCase().includes('success') ? 'var(--success-color)' : 'var(--danger-color)' }}>{msg}</span>}
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{
          width: '120px', 
          height: type === 'logo' ? '120px' : '80px', 
          borderRadius: '0.5rem', 
          backgroundColor: 'rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: '1px dashed var(--border-color)'
        }}>
          {preview ? (
            <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No image</span>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="btn btn-primary" style={{ display: 'inline-block', textAlign: 'center', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Uploading...' : 'Choose File'}
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={loading} />
          </label>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Recommended: {type === 'logo' ? 'Square PNG/JPG (e.g., 200x200)' : 'High-Res JPG (e.g., 1920x1080)'}
          </p>
        </div>
      </div>
    </div>
  )
}
