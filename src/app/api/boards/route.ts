import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const CreateBoardSchema = z.object({
  title: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateBoardSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Input tidak valid', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, email } = parsed.data

    const slug = nanoid(12)
    const editToken = crypto.randomUUID()

    const board = await prisma.board.create({
      data: {
        slug,
        title: title?.trim() || 'Untitled Board',
        editToken,
        email: email?.trim() || null,
      },
    })

    return NextResponse.json(
      { slug: board.slug, editToken: board.editToken },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/boards]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
