'use client'

import { useState } from 'react'

export default function ExportCSVButton({ 
  data, 
  filename 
}: { 
  data: Record<string, any>[], 
  filename: string 
}) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)
    try {
      if (data.length === 0) {
        alert("No data to export.")
        setIsExporting(false)
        return
      }

      // Extract headers
      const headers = Object.keys(data[0])
      
      // Convert to CSV string
      const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => 
          headers.map(header => {
            let cell = row[header] === null || row[header] === undefined ? '' : String(row[header])
            // Escape quotes and wrap in quotes if contains comma
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
              cell = `"${cell.replace(/"/g, '""')}"`
            }
            return cell
          }).join(',')
        )
      ].join('\n')

      // Create Blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Export failed", err)
      alert("Failed to export CSV.")
    }
    setIsExporting(false)
  }

  return (
    <button 
      onClick={handleExport}
      disabled={isExporting}
      className="btn"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
        backgroundColor: 'var(--bg-card)', color: 'var(--text-light)',
        border: '1px solid var(--border-color)', cursor: 'pointer',
        fontWeight: 500, transition: 'all 0.2s',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dark)'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
    >
      {isExporting ? 'Exporting...' : '📥 Export CSV'}
    </button>
  )
}
