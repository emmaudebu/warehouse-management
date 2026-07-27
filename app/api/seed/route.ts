import { NextResponse } from 'next/server'
import { seedDatabase } from '@/app/actions/seed'

export async function GET() {
  try {
    const result = await seedDatabase()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
