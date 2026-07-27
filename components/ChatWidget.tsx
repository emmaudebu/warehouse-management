'use client'

import { useState, useEffect, useRef } from 'react'
import Pusher from 'pusher-js'
import { getUsers, getConversations, getOrCreateConversation, getMessages, sendMessage, markAsRead } from '@/app/actions/chat'

export default function ChatWidget({ currentUserId }: { currentUserId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [pusherClient, setPusherClient] = useState<Pusher | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize Pusher & load initial data
  useEffect(() => {
    if (!currentUserId) return

    const loadData = async () => {
      setLoading(true)
      const [u, c] = await Promise.all([getUsers(), getConversations()])
      setUsers(u)
      setConversations(c)
      setLoading(false)
    }
    loadData()

    if (process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      const p = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER
      })
      setPusherClient(p)
    }

    return () => {
      if (pusherClient) pusherClient.disconnect()
    }
  }, [currentUserId])

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      // Cheerful pop sound
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2)
      
      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.2)
    } catch(e) {
      console.log('Audio not supported or blocked')
    }
  }

  // Listen for background notifications (when chat is closed or in another conversation)
  useEffect(() => {
    if (!currentUserId || !pusherClient) return
    const channel = pusherClient.subscribe(`user-${currentUserId}`)
    
    channel.bind('new-notification', async () => {
      const c = await getConversations()
      setConversations(c)
      playNotificationSound()
    })

    return () => {
      pusherClient.unsubscribe(`user-${currentUserId}`)
    }
  }, [currentUserId, pusherClient])

  // Listen to active conversation messages
  useEffect(() => {
    if (!activeConversation || !pusherClient) return

    const loadMessages = async () => {
      const msgs = await getMessages(activeConversation)
      setMessages(msgs)
      await markAsRead(activeConversation)
      setConversations(prev => prev.map(c => c.id === activeConversation ? { ...c, unreadCount: 0 } : c))
      scrollToBottom()
    }
    loadMessages()

    const channel = pusherClient.subscribe(`conversation-${activeConversation}`)
    channel.bind('new-message', (data: any) => {
      setMessages(prev => [...prev, data])
      scrollToBottom()
      if (data.senderId !== currentUserId) {
        markAsRead(activeConversation)
        playNotificationSound()
      }
    })

    return () => {
      pusherClient.unsubscribe(`conversation-${activeConversation}`)
    }
  }, [activeConversation, pusherClient])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const startChat = async (userId: string) => {
    const convId = await getOrCreateConversation(userId)
    setActiveConversation(convId)
    // Refresh conversations list to make sure it's there
    const c = await getConversations()
    setConversations(c)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !activeConversation) return
    const text = inputValue
    setInputValue('')
    // Optimistic UI update could go here
    await sendMessage(activeConversation, text)
  }

  const totalUnread = (conversations || []).reduce((sum, c) => sum + c.unreadCount, 0)

  if (!currentUserId) return null

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
      
      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '4rem',
          right: 0,
          width: '350px',
          height: '500px',
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}>
          {/* Header */}
          <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
              {activeConversation ? 'Chat' : 'Staff Directory'}
            </h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {activeConversation && (
                <button onClick={() => setActiveConversation(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>
                  ← Back
                </button>
              )}
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f9fafb', padding: '1rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>Loading...</div>
            ) : !activeConversation ? (
              // Directory List
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {users.map(u => {
                  const conv = conversations.find(c => c.users.some((cu: any) => cu.id === u.id))
                  const unread = conv ? conv.unreadCount : 0
                  return (
                    <div 
                      key={u.id}
                      onClick={() => startChat(u.id)}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{u.role.replace('_', ' ')}</div>
                      </div>
                      {unread > 0 && (
                        <div style={{
                          backgroundColor: 'var(--danger-color)',
                          color: 'white',
                          borderRadius: '999px',
                          padding: '0.1rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {unread}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              // Chat Messages
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.map((m, i) => {
                  const isMe = m.senderId === currentUserId
                  return (
                    <div key={m.id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                      <div style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: isMe ? 'var(--primary-color)' : 'white',
                        color: isMe ? 'white' : '#111827',
                        borderRadius: '1rem',
                        borderBottomRightRadius: isMe ? 0 : '1rem',
                        borderBottomLeftRadius: isMe ? '1rem' : 0,
                        border: isMe ? 'none' : '1px solid #e5e7eb',
                        wordBreak: 'break-word'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: m.content.replace(/(https?:\/\/[^\s]+)/g, (url: string) => `<a href="${url}" target="_blank" style="text-decoration: underline; color: inherit;">${url}</a>`)
                      }}
                      />
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.25rem', textAlign: isMe ? 'right' : 'left' }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer Input */}
          {activeConversation && (
            <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', backgroundColor: 'white', display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Type a message..."
                style={{ flex: 1, padding: '0.75rem', borderRadius: '999px', border: '1px solid #d1d5db', outline: 'none' }}
              />
              <button type="submit" style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '999px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
                ➤
              </button>
            </form>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-color)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          position: 'relative',
          transition: 'transform 0.2s',
          animation: !isOpen ? 'ripple 2s infinite' : 'none'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        💬
        {totalUnread > 0 && !isOpen && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: 'var(--danger-color)',
            color: 'white',
            borderRadius: '50%',
            width: '22px',
            height: '22px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white'
          }}>
            {totalUnread}
          </div>
        )}
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ripple {
          0% {
            box-shadow: 0 0 0 0 rgba(252, 163, 17, 0.4);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(252, 163, 17, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(252, 163, 17, 0);
          }
        }
      `}} />
    </div>
  )
}
