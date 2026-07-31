import prisma from '@/lib/prisma'
import Link from 'next/link'
import WhatsAppButton from '@/components/WhatsAppButton'
import PrintButton from '@/components/PrintButton'
import ExportAndShareMenu from '@/components/ExportAndShareMenu'

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const transfer = await prisma.transfer.findUnique({
    where: { id },
    include: {
      source: true,
      destination: { include: { users: true } },
      initiatedBy: true,
      items: { include: { product: true } },
      customer: true
    }
  })

  if (!transfer) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Receipt not found.</div>
  }

  const companySettings = await prisma.companySettings.findFirst()

  const destinationStorekeeper = transfer.destination.users.find(u => u.role === 'STORE_KEEPER' || u.role === 'SUPPLIER')
  const destPhone = destinationStorekeeper?.phone || ''

  const director = await prisma.user.findFirst({
    where: { role: 'DIRECTOR' }
  })
  const directorPhone = director?.phone || ''

  const settings = await prisma.companySettings.findFirst()
  const templateStr = settings?.whatsappTemplate || "Hello! Here is your invoice from {company_name}. Thank you for your patronage! Ref: {reference}"
  const waMessage = templateStr
    .replace('{company_name}', settings?.name || 'our company')
    .replace('{reference}', transfer.reference)

  const systemUsers = await prisma.user.findMany({
    select: { id: true, name: true, phone: true, role: true }
  })

  const formattedDate = new Date(transfer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
  const docType = transfer.destination.type === 'EXTERNAL' ? 'Receipt' : 'Invoice'
  const authorizerName = transfer.initiatedBy.name
  const pdfFilename = `${authorizerName} - ${docType} - ${formattedDate}`

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      
      {/* Action Bar (Not Printed) */}
      <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', width: '100%', maxWidth: '800px', justifyContent: 'space-between' }}>
        <Link href="/" className="btn" style={{ backgroundColor: 'white', color: 'black', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Dashboard
        </Link>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <PrintButton />
          <ExportAndShareMenu 
            targetId="receipt-content" 
            fileName={pdfFilename} 
            users={systemUsers}
            waMessage={waMessage}
          />
        </div>
      </div>

      {/* Printable Receipt Area */}
      <div id="receipt-content" className="receipt-paper" style={{
        backgroundColor: 'white',
        width: '100%',
        maxWidth: '800px',
        padding: '3rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        color: 'black'
      }}>
        
        {/* Header */}
        <div className="receipt-header" style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {companySettings?.logoUrl && (
              <img src={companySettings.logoUrl} alt="Company Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '0.5rem' }} />
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em' }}>{companySettings?.name || 'Company Name'}</h2>
              {companySettings?.address && <p style={{ margin: '0.5rem 0 0 0', color: '#4b5563', maxWidth: '250px' }}>{companySettings.address}</p>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {transfer.destination.type === 'EXTERNAL' ? 'RECEIPT' : 'INVOICE'}
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600, fontSize: '1.1rem', color: '#374151' }}>{transfer.reference}</p>
            <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280' }}>Date: {new Date(transfer.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Logistics Info */}
        <div className="receipt-logistics" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#9ca3af', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Dispatching From</h4>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>{transfer.source.name}</p>
            <p style={{ margin: '0.25rem 0 0 0', color: '#4b5563' }}>Authorized by: {transfer.initiatedBy.name}</p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#9ca3af', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>{transfer.destination.type === 'EXTERNAL' ? 'Customer' : 'Delivering To'}</h4>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>{transfer.customer?.name || transfer.destination.name}</p>
            <p style={{ margin: '0.25rem 0 0 0', color: '#4b5563' }}>{transfer.destination.location}</p>
          </div>
          {transfer.destination.type !== 'EXTERNAL' && (
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#9ca3af', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Logistics</h4>
              <p style={{ margin: 0, fontWeight: 500 }}>Delivery Person: {transfer.driverName || 'N/A'}</p>
              <p style={{ margin: '0.25rem 0 0 0', color: '#4b5563' }}>Phone: {transfer.vehicleNum || 'N/A'}</p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div style={{ overflowX: 'auto', marginBottom: '3rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '1rem 0', color: '#374151' }}>Product</th>
              <th style={{ textAlign: 'left', padding: '1rem 0', color: '#374151' }}>Batch No.</th>
              <th style={{ textAlign: 'right', padding: '1rem 0', color: '#374151' }}>Price (₦)</th>
              <th style={{ textAlign: 'right', padding: '1rem 0', color: '#374151' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '1rem 0', color: '#374151' }}>Total (₦)</th>
            </tr>
          </thead>
          <tbody>
            {transfer.items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '1rem 0', fontWeight: 500 }}>
                  {item.product.name}
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 400, marginTop: '0.25rem' }}>
                    {item.size ? `Size: ${item.size}` : ''} {item.packageType ? `(${item.packageType})` : ''}
                  </div>
                </td>
                <td style={{ padding: '1rem 0', color: '#6b7280' }}>{item.batchNumber || '-'}</td>
                <td style={{ padding: '1rem 0', textAlign: 'right', color: '#6b7280' }}>{item.product.sellingPrice.toLocaleString()}</td>
                <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 700 }}>
                  {item.quantity} <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 400 }}>{item.product.unit}</span>
                </td>
                <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 700 }}>
                  {(item.quantity * item.product.sellingPrice).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #e5e7eb' }}>
              <td colSpan={3} style={{ padding: '1.5rem 0', textAlign: 'right', fontWeight: 600 }}>Total Items Supplied:</td>
              <td style={{ padding: '1.5rem 0', textAlign: 'right', fontWeight: 800, fontSize: '1.25rem' }}>
                {transfer.items.reduce((sum, item) => sum + item.quantity, 0)}
              </td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={4} style={{ padding: '0.5rem 0 1.5rem 0', textAlign: 'right', fontWeight: 600 }}>Grand Total:</td>
              <td style={{ padding: '0.5rem 0 1.5rem 0', textAlign: 'right', fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                ₦{transfer.items.reduce((sum, item) => sum + (item.quantity * item.product.sellingPrice), 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
        </div>

        {/* Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '4rem', marginTop: '4rem' }}>
          <div>
            <div style={{ borderBottom: '1px solid #d1d5db', height: '40px' }}></div>
            <p style={{ textAlign: 'center', marginTop: '0.5rem', color: '#4b5563', fontSize: '0.875rem' }}>Authorized Signature (Dispatch)</p>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #d1d5db', height: '40px' }}></div>
            <p style={{ textAlign: 'center', marginTop: '0.5rem', color: '#4b5563', fontSize: '0.875rem' }}>Received By (Sign & Date)</p>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ marginTop: '4rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
          Generated by Factory/Warehouse Management System • Document ID: {transfer.id}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background-color: white !important; }
          .no-print { display: none !important; }
          .receipt-paper { box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
        }
        @media (max-width: 640px) {
          .receipt-paper { padding: 1.5rem !important; }
          .receipt-header { flex-direction: column; text-align: left; }
          .receipt-header > div:last-child { text-align: left !important; }
          .receipt-logistics { flex-direction: column; }
        }
      `}} />
    </div>
  )
}
