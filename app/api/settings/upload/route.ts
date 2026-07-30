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
    const extension = file.name.split('.').pop() || 'png'
    const filename = `${type}-${Date.now()}.${extension}`
    
    let fileUrl = ''

    // Attempt Supabase Upload if environment variables are present
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await supabase.storage
        .from('company_assets')
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: true
        })
        
      if (error) throw new Error(`Supabase upload failed: ${error.message}`)
      
      const { data: publicUrlData } = supabase.storage.from('company_assets').getPublicUrl(filename)
      fileUrl = publicUrlData.publicUrl
    } else {
      // Fallback to local file system
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      try {
        await mkdir(uploadDir, { recursive: true })
      } catch (e) {
        // Ignore if exists
      }
      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, buffer)
      fileUrl = `/uploads/${filename}`
    }

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
