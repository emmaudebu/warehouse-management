import prisma from '@/lib/prisma'
import Card from '@/components/Card'
import UserActionButtons from '@/components/UserActionButtons'
import { updateCompanySettings, createWarehouse } from '@/app/actions/admin'
import CreateUserForm from '@/components/CreateUserForm'
import { addExpense, deleteExpense } from '@/app/actions/expenses'
import { addAnnouncement, clearAnnouncements } from '@/app/actions/announcements'
import SettingsUploader from '@/components/SettingsUploader'
import { getSystemSettings } from '@/app/actions/settings'

export default async function AdminControlPanel() {
  const [
    settings,
    warehouses,
    users,
    expenses,
    announcement
  ] = await prisma.$transaction([
    prisma.companySettings.findFirst(),
    prisma.warehouse.findMany({ where: { type: { not: 'EXTERNAL' } } }),
    prisma.user.findMany({ include: { warehouse: true } }),
    prisma.expense.findMany({ orderBy: { date: 'desc' }, take: 10, include: { recordedBy: true } }),
    prisma.announcement.findFirst({ where: { isActive: true } })
  ])
  const sysSettings = await getSystemSettings()

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      <header>
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Admin Control Panel ⚙️</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage company settings, locations, and user accounts.</p>
      </header>

      {/* Top Row: Company Settings & Warehouse */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', 
        gap: '1.5rem',
        alignItems: 'start',
        marginBottom: '1.5rem'
      }}>
        
        {/* Company Settings */}
        <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🏢 Company Branding</h3>
          <form action={updateCompanySettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
              <FormGroup label="Company Name" type="text" name="name" defaultValue={settings?.name || ''} />
              <FormGroup label="HQ Address" type="text" name="address" defaultValue={settings?.address || ''} />
            </div>
            
            <FormGroup label="Global Low Stock Threshold" type="number" name="globalLowStockThreshold" defaultValue={settings?.globalLowStockThreshold?.toString() || '50'} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>WhatsApp Message Template</label>
              <textarea name="whatsappTemplate" defaultValue={settings?.whatsappTemplate || ''} style={{
                padding: '0.875rem', borderRadius: '0.75rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-light)', outline: 'none', width: '100%', minHeight: '80px', resize: 'vertical'
              }} placeholder="Hello! Here is your invoice..."></textarea>
            </div>
            
            <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem' }}>Save Details</button>
          </form>
        </Card>

        {/* Create Warehouse */}
        <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📍 New Location</h3>
          <form action={createWarehouse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <FormGroup label="Warehouse Name" type="text" name="name" placeholder="e.g. Lagos Main Store" />
            <FormGroup label="Location / City" type="text" name="location" placeholder="e.g. Ikeja" />
            <FormGroup label="Type" type="select" name="type" options={[
              { label: 'Store (Market)', value: 'MARKET' },
              { label: 'Factory', value: 'FACTORY' },
              { label: 'Supplier Hub', value: 'SUPPLIER' }
            ]} />
            <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem' }}>Create Location 🏗️</button>
          </form>
        </Card>
      </section>

      {/* Bottom Row: Media Assets & Create User */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', 
        gap: '1.5rem',
        alignItems: 'start',
        marginBottom: '1.5rem'
      }}>

        {/* Media Assets */}
        <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🖼️ Media Assets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SettingsUploader label="Company Logo" type="logo" currentUrl={sysSettings?.logoUrl || settings?.logoUrl || undefined} />
            <SettingsUploader label="Login Background" type="bg" currentUrl={sysSettings?.loginBgUrl || undefined} />
          </div>
        </Card>

        {/* Create User */}
        <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>👤 Create User Account</h3>
          <CreateUserForm warehouses={warehouses} />
        </Card>

      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
        {/* Noticeboard */}
        <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📌 Noticeboard</h3>
            {announcement && (
              <form action={clearAnnouncements}>
                <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.875rem' }}>Clear Current</button>
              </form>
            )}
          </div>
          <form action={addAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Broadcast Message</label>
              <textarea name="message" required style={{
                padding: '0.875rem', borderRadius: '0.75rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-light)', outline: 'none', width: '100%', minHeight: '80px', resize: 'vertical'
              }} placeholder="Enter announcement..."></textarea>
            </div>
            <FormGroup label="Priority" type="select" name="priority" options={[
              { label: 'Normal', value: 'NORMAL' },
              { label: 'High (Red)', value: 'HIGH' }
            ]} />
            <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem' }}>Post Announcement 📢</button>
          </form>
        </Card>

        {/* Expenses */}
        <Card style={{ borderTop: '4px solid var(--danger-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💸 Log Expense</h3>
          <form action={addExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <FormGroup label="Amount (₦)" type="number" name="amount" placeholder="e.g. 5000" />
            <FormGroup label="Category" type="select" name="category" options={[
              { label: 'Fuel / Diesel', value: 'Fuel' },
              { label: 'Transportation', value: 'Transportation' },
              { label: 'Maintenance', value: 'Maintenance' },
              { label: 'Packaging', value: 'Packaging' },
              { label: 'Miscellaneous', value: 'Miscellaneous' }
            ]} />
            <FormGroup label="Description (Optional)" type="text" name="description" placeholder="e.g. Generator fuel for Tuesday" />
            <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem', backgroundColor: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>Log Expense</button>
          </form>

          {expenses.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>Recent Expenses</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {expenses.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ color: 'var(--text-light)', fontWeight: 500 }}>{e.category}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{e.description || 'No description'}</div>
                    </div>
                    <div style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>
                      -₦{e.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Existing Users Table */}
      <section>
        <Card>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-light)' }}>Active Personnel</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ paddingBottom: '0.75rem' }}>Name</th>
                <th style={{ paddingBottom: '0.75rem' }}>Role</th>
                <th style={{ paddingBottom: '0.75rem' }}>Assigned Location</th>
                <th style={{ paddingBottom: '0.75rem' }}>WhatsApp</th>
                <th style={{ paddingBottom: '0.75rem' }}>Status</th>
                <th style={{ paddingBottom: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '999px', 
                      fontSize: '0.75rem', 
                      backgroundColor: 'rgba(252, 163, 17, 0.1)', 
                      color: 'var(--primary-hover)' 
                    }}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{u.warehouse?.name || 'Global'}</td>
                  <td style={{ padding: '1rem 0' }}>{u.phone || 'N/A'}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '999px', 
                      fontSize: '0.75rem', 
                      backgroundColor: u.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: u.status === 'ACTIVE' ? 'var(--success-color)' : '#ef4444' 
                    }}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0' }}>
                    <UserActionButtons userId={u.id} currentStatus={u.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  )
}

function FormGroup({ label, type, name, placeholder, defaultValue, options }: { label: string, type: string, name: string, placeholder?: string, defaultValue?: string, options?: {label: string, value: string}[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>
      {type === 'select' ? (
        <select name={name} required={name !== 'warehouseId'} style={{
          padding: '0.875rem',
          borderRadius: '0.75rem',
          backgroundColor: 'var(--bg-dark)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-light)',
          outline: 'none',
          width: '100%',
          transition: 'all 0.2s'
        }}>
          {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <input type={type} name={name} placeholder={placeholder} defaultValue={defaultValue} required={name !== 'phone' && name !== 'email'} style={{
          padding: '0.875rem',
          borderRadius: '0.75rem',
          backgroundColor: 'var(--bg-dark)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-light)',
          outline: 'none',
          width: '100%',
          transition: 'all 0.2s'
        }} />
      )}
    </div>
  )
}
