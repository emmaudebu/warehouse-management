'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({ text, loadingText = 'Saving...' }: { text: string, loadingText?: string }) {
  const { pending } = useFormStatus()
  
  return (
    <button 
      className="btn btn-primary" 
      type="submit" 
      disabled={pending} 
      style={{ 
        width: '100%', 
        padding: '1rem', 
        fontSize: '1rem',
        opacity: pending ? 0.7 : 1,
        cursor: pending ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {pending ? loadingText : text}
    </button>
  )
}
