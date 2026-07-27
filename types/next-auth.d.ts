import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      warehouseId?: string | null
      status: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    role: string
    warehouseId?: string | null
    status: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    warehouseId?: string | null
    status: string
  }
}
