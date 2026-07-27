'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ExportButtons({ transfers }: { transfers: any[] }) {
  
  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text('FWMS Recent Transfers Report', 14, 15)
    
    const tableColumn = ["Reference", "Date", "Status", "Source", "Destination", "Product", "Qty"]
    const tableRows = transfers.flatMap(t => 
      t.items.map((item: any) => [
        t.reference,
        new Date(t.createdAt).toLocaleDateString(),
        t.status,
        t.source.name,
        t.customer?.name || t.destination.name,
        item.product.name,
        item.quantity.toString()
      ])
    )

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20
    })

    doc.save('fwms-transfers.pdf')
  }

  const handleExportCSV = () => {
    window.open('/api/export/csv', '_blank')
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button onClick={handleExportCSV} className="btn hover-scale" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontSize: '0.75rem' }}>
        Export CSV
      </button>
      <button onClick={handleExportPDF} className="btn hover-scale" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontSize: '0.75rem' }}>
        Export PDF
      </button>
    </div>
  )
}
