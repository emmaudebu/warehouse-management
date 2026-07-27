'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ROLES = [
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'FACTORY_MANAGER', label: 'Factory Manager' },
  { value: 'STORE_KEEPER', label: 'Store Keeper' },
  { value: 'SALESPERSON', label: 'Salesperson' },
  { value: 'SUPPLIER', label: 'Supplier' }
]

export default function LoginForm({ loginBgUrl, companyName = 'My Company', logoUrl }: { loginBgUrl?: string, companyName?: string, logoUrl?: string }) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('DIRECTOR')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
      role
    })

    if (res?.error) {
      setError('Invalid credentials or role mismatch.')
      setIsLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-darker)',
      backgroundImage: loginBgUrl ? `url(${loginBgUrl})` : 'linear-gradient(135deg, var(--bg-darker) 0%, #1a1c29 100%)',
      backgroundSize: '100% auto',
      backgroundRepeat: 'repeat',
      backgroundPosition: 'top center',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(20, 33, 61, 0.6) 0%, rgba(0, 0, 0, 0.8) 100%)',
        backdropFilter: 'blur(8px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '500px',
        padding: '3rem',
        margin: '1rem',
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        borderRadius: '1.5rem',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--glass-shadow)',
        zIndex: 1,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          {logoUrl && (
            <img src={logoUrl} alt={`${companyName} Logo`} style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '1rem', borderRadius: '50%' }} />
          )}
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', fontWeight: 800, color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.3 }}>
            Welcome Back to <br/><span className="text-gradient">{companyName}</span><br/>Premium Management System
          </h3>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center', fontWeight: 500 }}>
            Please sign in to your account.
          </h3>
        </div>

        {error && (
          <div className="animate-fade-in" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             ⚠️ {error}
          </div>
        )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Role Selection (Radio Pills) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Role</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {ROLES.map(r => (
                  <label key={r.value} style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '2rem',
                    border: `1px solid ${role === r.value ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    backgroundColor: role === r.value ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                    color: role === r.value ? 'var(--primary-color)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    userSelect: 'none',
                    transform: role === r.value ? 'scale(1.05)' : 'scale(1)'
                  }}
                  onMouseEnter={e => { if(role !== r.value) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={e => { if(role !== r.value) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <input 
                      type="radio" 
                      name="role" 
                      value={r.value}
                      checked={role === r.value}
                      onChange={() => setRole(r.value)}
                      style={{ display: 'none' }}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>


            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-dark)',
                border: `1px solid ${focusedInput === 'username' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                transition: 'all 0.2s',
                boxShadow: focusedInput === 'username' ? '0 0 0 3px rgba(252, 163, 17, 0.1)' : 'none'
              }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>👤</span>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedInput('username')}
                  onBlur={() => setFocusedInput(null)}
                  required 
                  placeholder="Enter your username"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    color: 'var(--text-light)',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-dark)',
                border: `1px solid ${focusedInput === 'password' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                transition: 'all 0.2s',
                boxShadow: focusedInput === 'password' ? '0 0 0 3px rgba(252, 163, 17, 0.1)' : 'none'
              }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🔒</span>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  required 
                  placeholder="••••••••"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    color: 'var(--text-light)',
                    fontSize: '1rem',
                    letterSpacing: (password && !showPassword) ? '0.1em' : 'normal'
                  }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: 'var(--text-muted)',
                    marginLeft: '0.5rem',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.7,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              style={{
              marginTop: '0.5rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.8 : 1,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 20px rgba(252, 163, 17, 0.3)'
            }}
            onMouseOver={e => { if(!isLoading) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(252, 163, 17, 0.4)' }}
            onMouseOut={e => { if(!isLoading) e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(252, 163, 17, 0.3)' }}
            onMouseDown={e => { if(!isLoading) e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={e => { if(!isLoading) e.currentTarget.style.transform = 'translateY(-2px)' }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
          
          <div style={{ marginTop: '3rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.6', padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.5rem', border: '1px dashed var(--border-color)' }}>
            <strong>Demo Accounts:</strong><br />
            director | factory<br/>
            keeper | supplier<br/>
            <em>Password for all: password123</em>
          </div>
        </div>
    </div>
  )
}
