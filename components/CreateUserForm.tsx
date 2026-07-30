'use client'

import { useState } from 'react'
import { createUser } from '@/app/actions/admin'
import ConfirmModal from './ConfirmModal'

export default function CreateUserForm({ warehouses }: { warehouses: any[] }) {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<FormData | null>(null)
  
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormData(new FormData(e.currentTarget))
    setShowModal(true)
  }

  const handleConfirm = async () => {
    if (formData) {
      await createUser(formData)
    }
    setShowModal(false)
  }

  return (
    <>
      <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
          <FormGroup label="Full Name" type="text" name="name" required />
          <FormGroup label="Username" type="text" name="username" required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
          <FormGroup label="Email Address" type="email" name="email" placeholder="Optional" />
          <FormGroup label="Password" type="password" name="password" required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
          <FormGroup label="WhatsApp Number" type="text" name="phone" placeholder="+234..." required />
          <FormGroup label="Role" type="select" name="role" required options={[
            { label: 'Storekeeper', value: 'STORE_KEEPER' },
            { label: 'Factory Manager', value: 'FACTORY_MANAGER' },
            { label: 'Supplier', value: 'SUPPLIER' },
            { label: 'Salesperson', value: 'SALESPERSON' },
            { label: 'Director', value: 'DIRECTOR' }
          ]} />
          <FormGroup label="Assign Location" type="select" name="warehouseId" options={[
            { label: 'None (Global)', value: '' },
            ...warehouses.map(w => ({ label: `${w.name} (${w.type})`, value: w.id }))
          ]} />
        </div>
        
        <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>Create User Account 🚀</button>
      </form>

      <ConfirmModal
        isOpen={showModal}
        title="Create User Account"
        message="Are you sure you want to create this user account?"
        confirmText="Create User"
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
      />
    </>
  )
}

function FormGroup({ label, type, name, placeholder, required, options }: { label: string, type: string, name: string, placeholder?: string, required?: boolean, options?: {label: string, value: string}[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>
      {type === 'select' ? (
        <select name={name} required={required} style={{
          padding: '0.875rem',
          borderRadius: '0.75rem',
          backgroundColor: 'var(--bg-dark)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-light)',
          outline: 'none',
          width: '100%'
        }}>
          {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <input type={type} name={name} required={required} placeholder={placeholder} style={{
          padding: '0.875rem',
          borderRadius: '0.75rem',
          backgroundColor: 'var(--bg-dark)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-light)',
          outline: 'none',
          width: '100%'
        }} />
      )}
    </div>
  )
}
