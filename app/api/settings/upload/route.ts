import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'DIRECTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file || !type || !['logo', 'bg'].includes(type)) {
      return NextResponse.json({ error: 'Invalid file or type' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = file.type || 'image/png'
    
    // Convert directly to Base64 string to store in the database
    // This avoids EROFS (Read-Only File System) errors in Serverless environments like Netlify
    const base64Data = buffer.toString('base64')
    const fileUrl = `data:${mimeType};base64,${base64Data}`

    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    })

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 'default',
          logoUrl: type === 'logo' ? fileUrl : null,
          loginBgUrl: type === 'bg' ? fileUrl : null
        }
      })
    } else {
      settings = await prisma.systemSettings.update({
        where: { id: 'default' },
        data: {
          ...(type === 'logo' ? { logoUrl: fileUrl } : { loginBgUrl: fileUrl })
        }
      })
    }

    return NextResponse.json({ success: true, url: fileUrl })
  } catch (error: any) {
    console.error('Upload Error:', error)
    return NextResponse.json({ error: 'Failed to upload file: ' + error.message }, { status: 500 })
  }
}
