'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { bulkUploadProducts } from '@/app/actions/products'

export default function BulkProductUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null)
  const [errorDetails, setErrorDetails] = useState<string[]>([])

  const downloadTemplate = () => {
    const templateRows = [
      ["Name", "Category", "Unit", "Size", "Measurement", "Cost Price", "Selling Price", "Low Stock Threshold", "Initial Quantity", "SKU"],
      ["Test Product", "Cosmetics", "Pieces", "500", "ml", "1000", "1500", "50", "100", ""]
    ]
    const csvContent = templateRows.map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "product_upload_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setMessage({ text: 'Please select a CSV file first.', type: 'error' })
      return
    }

    setIsUploading(true)
    setMessage(null)
    setErrorDetails([])

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data
        if (!data || data.length === 0) {
          setMessage({ text: 'The CSV file appears to be empty.', type: 'error' })
          setIsUploading(false)
          return
        }

        setMessage({ text: `Parsed ${data.length} rows. Uploading to database...`, type: 'info' })
        
        try {
          const res = await bulkUploadProducts(data)
          if (res.error) {
            setMessage({ text: res.error, type: 'error' })
          } else if (res.success) {
            setMessage({ 
              text: `Successfully imported ${res.count} products!`, 
              type: res.errors && res.errors.length > 0 ? 'info' : 'success' 
            })
            if (res.errors && res.errors.length > 0) {
              setErrorDetails(res.errors)
            } else {
              setFile(null)
              const input = document.getElementById('csv-upload') as HTMLInputElement
              if (input) input.value = ''
            }
          }
        } catch (err: any) {
          setMessage({ text: err.message, type: 'error' })
        }
        setIsUploading(false)
      },
      error: (error) => {
        setMessage({ text: `Failed to parse CSV: ${error.message}`, type: 'error' })
        setIsUploading(false)
      }
    })
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Bulk Upload Products</span>
        <button 
          type="button" 
          onClick={downloadTemplate}
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', backgroundColor: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '999px', cursor: 'pointer' }}
        >
          Download Template
        </button>
      </h3>
      
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>CSV File</label>
          <input 
            type="file" 
            id="csv-upload"
            accept=".csv"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-light)' }}
            disabled={isUploading}
          />
        </div>

        <button 
          type="submit" 
          disabled={!file || isUploading}
          className="btn"
          style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: file && !isUploading ? 'pointer' : 'not-allowed', opacity: file && !isUploading ? 1 : 0.5 }}
        >
          {isUploading ? 'Processing...' : 'Upload Products'}
        </button>
      </form>

      {message && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          borderRadius: '0.5rem', 
          backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          color: message.type === 'success' ? 'var(--success-color)' : message.type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)',
          fontSize: '0.875rem',
          fontWeight: 500
        }}>
          {message.text}
        </div>
      )}

      {errorDetails.length > 0 && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <p style={{ color: 'var(--warning-color)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Some rows had errors:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {errorDetails.map((err, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
