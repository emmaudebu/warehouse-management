import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password || !credentials?.role) return null

        const username = (credentials.username as string).toLowerCase()

        const user = await prisma.user.findUnique({
          where: { username }
        })

        if (!user || user.role !== credentials.role) return null

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password).catch(() => false)

        if (isPasswordValid) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            warehouseId: user.warehouseId,
            status: user.status
          }
        }
        
        return null
      }
    })
  ],
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
})
