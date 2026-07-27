'use client'

import { useState } from 'react'
import { updateProfile } from '@/app/actions/user'
import { useRouter } from 'next/navigation'

export default function ProfileForm({ user }: { user: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    
    try {
      const res = await updateProfile(formData)
      if (res.success) {
        setMessage('Profile updated successfully!')
        setFormData(prev => ({ ...prev, password: '' }))
        router.refresh()
      } else {
        setError(res.error || 'Failed to update profile')
      }
    } catch (err: any) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-darker)',
    color: 'var(--text-light)',
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s'
  }

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '0.5rem',
    display: 'block',
    color: 'var(--text-muted)'
  }

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>My Profile</h2>
      
      {message && <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', borderRadius: '0.5rem', border: '1px solid var(--success-color)' }}>{message}</div>}
      {error && <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: '0.5rem', border: '1px solid var(--danger-color)' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <div>
          <label style={labelStyle}>Username</label>
          <input
            type="text"
            value={user.username || ''}
            readOnly
            style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(0,0,0,0.1)' }}
            title="Username cannot be changed after account creation"
          />
        </div>

        <div>
          <label style={labelStyle}>Full Name</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            style={inputStyle}
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            style={inputStyle}
            placeholder="john@example.com"
          />
        </div>
        
        <div>
          <label style={labelStyle}>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            style={inputStyle}
            placeholder="+1 234 567 8900"
          />
        </div>
        
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Change Password</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Leave this blank if you do not wish to change your password.</p>
          <label style={labelStyle}>New Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={inputStyle}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
          {loading ? 'Saving...' : 'Save Profile Settings'}
        </button>
      </form>
    </div>
  )
}
