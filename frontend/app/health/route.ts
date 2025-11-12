import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:3001'

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch health status' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend unavailable', detail: String(error) },
      { status: 502 },
    )
  }
}

