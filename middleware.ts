import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')
  const role = req.auth?.user?.role
  
  // Define protected routes mapping
  const routeRoles: Record<string, string[]> = {
    '/director': ['DIRECTOR'],
    '/factory': ['FACTORY_MANAGER', 'DIRECTOR'],
    '/storekeeper': ['STORE_KEEPER', 'DIRECTOR'],
    '/supplier': ['SUPPLIER', 'DIRECTOR'],
    '/salesperson': ['SALESPERSON', 'DIRECTOR'] // Allow directors to view as well, or restrict to exact role
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      if (role === 'DIRECTOR') return NextResponse.redirect(new URL('/director', req.url))
      if (role === 'FACTORY_MANAGER') return NextResponse.redirect(new URL('/factory', req.url))
      if (role === 'STORE_KEEPER') return NextResponse.redirect(new URL('/storekeeper', req.url))
      if (role === 'SUPPLIER') return NextResponse.redirect(new URL('/supplier', req.url))
      if (role === 'SALESPERSON') return NextResponse.redirect(new URL('/salesperson', req.url))
    }
    return NextResponse.next()
  }

  // Handle root and generic /dashboard redirects
  if (req.nextUrl.pathname === '/dashboard' || req.nextUrl.pathname === '/') {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', req.url))
    
    if (role === 'DIRECTOR') return NextResponse.redirect(new URL('/director', req.url))
    if (role === 'FACTORY_MANAGER') return NextResponse.redirect(new URL('/factory', req.url))
    if (role === 'STORE_KEEPER') return NextResponse.redirect(new URL('/storekeeper', req.url))
    if (role === 'SUPPLIER') return NextResponse.redirect(new URL('/supplier', req.url))
    if (role === 'SALESPERSON') return NextResponse.redirect(new URL('/salesperson', req.url))
    
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Check role-based route access
  for (const [route, allowedRoles] of Object.entries(routeRoles)) {
    if (req.nextUrl.pathname.startsWith(route)) {
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      if (!allowedRoles.includes(role as string)) {
        // User is logged in but doesn't have permission, redirect to their actual dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
