'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { pusherServer } from '@/lib/pusher'

export async function getUsers() {
  const session = await auth()
  if (!session?.user?.id) return []

  const users = await prisma.user.findMany({
    where: { id: { not: session.user.id } },
    select: { id: true, name: true, role: true }
  })
  return users
}

export async function getConversations() {
  const session = await auth()
  if (!session?.user?.id) return []

  const conversations = await prisma.conversation.findMany({
    where: {
      users: {
        some: { id: session.user.id }
      }
    },
    include: {
      users: {
        where: { id: { not: session.user.id } },
        select: { id: true, name: true, role: true }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  // Calculate unread count per conversation
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: session.user.id },
          isRead: false
        }
      })
      return { ...conv, unreadCount }
    })
  )

  return conversationsWithUnread
}

export async function getMessages(conversationId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' }
  })
  return messages
}

export async function getOrCreateConversation(otherUserId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Check if conversation already exists between these two users
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { users: { some: { id: session.user.id } } },
        { users: { some: { id: otherUserId } } }
      ]
    }
  })

  if (existing) return existing.id

  // Create new conversation
  const newConv = await prisma.conversation.create({
    data: {
      users: {
        connect: [{ id: session.user.id }, { id: otherUserId }]
      }
    }
  })
  return newConv.id
}

export async function sendMessage(conversationId: string, content: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const message = await prisma.message.create({
    data: {
      content,
      conversationId,
      senderId: session.user.id
    },
    include: {
      sender: { select: { id: true, name: true } }
    }
  })

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  })

  // Trigger Pusher event on this conversation channel
  try {
    await pusherServer.trigger(`conversation-${conversationId}`, 'new-message', message)
    
    // Also trigger on the receiver's personal channel to update their unread badge
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { users: true }
    })
    const receiver = conversation?.users.find(u => u.id !== session.user.id)
    if (receiver) {
      await pusherServer.trigger(`user-${receiver.id}`, 'new-notification', { conversationId })
    }
  } catch (error) {
    console.error("Pusher error:", error)
  }

  return message
}

export async function markAsRead(conversationId: string) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      isRead: false
    },
    data: { isRead: true }
  })
}
