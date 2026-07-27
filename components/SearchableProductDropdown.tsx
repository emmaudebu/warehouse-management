'use client'

import { useState, useRef, useEffect } from 'react'

export default function SearchableProductDropdown({ 
  products, 
  value, 
  onChange,
  placeholder = "Search and select a product..."
}: { 
  products: { id: string, name: string, category: { name: string } }[],
  value: string,
  onChange: (val: string) => void,
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Find the currently selected product
  const selectedProduct = products.find(p => p.id === value)
  
  // Update local search term when selection changes (but only if closed)
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(selectedProduct ? selectedProduct.name : '')
    }
  }, [value, selectedProduct, isOpen])

  // Filter products based on search term
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm(selectedProduct ? selectedProduct.name : '')
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [selectedProduct])

  // Helper to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={i} style={{ backgroundColor: 'rgba(59, 130, 246, 0.4)', fontWeight: 'bold' }}>{part}</span> 
        : part
    )
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          if (!isOpen) setIsOpen(true)
        }}
        onFocus={() => {
          setIsOpen(true)
          setSearchTerm('') // Clear to show all options
        }}
        placeholder={placeholder}
        style={{
          padding: '0.875rem',
          borderRadius: '0.75rem',
          backgroundColor: 'var(--bg-dark)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-light)',
          outline: 'none',
          width: '100%',
          transition: 'all 0.2s',
          cursor: 'text'
        }}
      />
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.25rem',
          maxHeight: '250px',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
          zIndex: 50
        }}>
          {filteredProducts.length === 0 ? (
            <div style={{ padding: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              No products found.
            </div>
          ) : (
            filteredProducts.map(p => (
              <div 
                key={p.id}
                onClick={() => {
                  onChange(p.id)
                  setSearchTerm(p.name)
                  setIsOpen(false)
                }}
                style={{
                  padding: '0.75rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: value === p.id ? 'var(--bg-dark)' : 'transparent',
                  transition: 'background-color 0.1s'
                }}
                onMouseEnter={(e) => {
                  if (value !== p.id) e.currentTarget.style.backgroundColor = 'var(--bg-dark)'
                }}
                onMouseLeave={(e) => {
                  if (value !== p.id) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--text-light)' }}>
                    {highlightMatch(p.name, searchTerm)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {highlightMatch(p.category?.name || 'Uncategorized', searchTerm)}
                  </div>
                </div>
                {value === p.id && <span style={{ color: 'var(--primary-color)' }}>✓</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
