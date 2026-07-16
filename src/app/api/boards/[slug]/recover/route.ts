import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendRecoveryEmail } from '@/lib/email'

// Simple in-memory rate limiter (resets on cold start)
// For production, replace with Upstash Redis
const rateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const record = rateLimit.get(key)

  if (!record || now > record.resetAt) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (record.count >= RATE_LIMIT) return false

  record.count++
  return true
}

const RecoverSchema = z.object({
  email: z.string().email(),
})

interface Params {
  params: { slug: string }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { slug } = params

    // Rate limit by slug
    if (!checkRateLimit(slug)) {
      return NextResponse.json(
        { message: 'Kalau email ini terdaftar, token sudah dikirim.' },
        { status: 200 } // Return 200 to avoid revealing rate limit info
      )
    }

    const body = await request.json()
    const parsed = RecoverSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 })
    }

    const { email } = parsed.data

    const board = await prisma.board.findUnique({ where: { slug } })

    // Always return same message regardless of whether board/email exists
    if (board?.email && board.email.toLowerCase() === email.toLowerCase()) {
      sendRecoveryEmail(board.email, slug, board.editToken).catch(console.error)
    }

    return NextResponse.json(
      { message: 'Kalau email ini terdaftar, token sudah dikirim.' },
      { status: 200 }
    )
  } catch (err) {
    console.error('[POST /api/boards/[slug]/recover]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
