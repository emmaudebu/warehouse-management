import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.warehouseId = user.warehouseId
        token.id = user.id
        token.status = user.status
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.warehouseId = token.warehouseId as string
        session.user.id = token.id as string
        session.user.status = token.status as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
} satisfies NextAuthConfig
