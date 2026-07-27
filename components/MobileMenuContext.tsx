'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface MobileMenuContextType {
  isMobileSidebarOpen: boolean
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
}

const MobileMenuContext = createContext<MobileMenuContextType>({
  isMobileSidebarOpen: false,
  toggleMobileSidebar: () => {},
  closeMobileSidebar: () => {}
})

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [pathname])

  return (
    <MobileMenuContext.Provider 
      value={{ 
        isMobileSidebarOpen, 
        toggleMobileSidebar: () => setIsMobileSidebarOpen(!isMobileSidebarOpen), 
        closeMobileSidebar: () => setIsMobileSidebarOpen(false) 
      }}
    >
      {children}
    </MobileMenuContext.Provider>
  )
}

export const useMobileMenu = () => useContext(MobileMenuContext)
