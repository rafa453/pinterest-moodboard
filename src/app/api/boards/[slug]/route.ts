import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

interface Params {
  params: { slug: string }
}

// Slug hanya boleh berisi huruf (upper/lowercase), angka, dan dash (format nanoid)
const SLUG_REGEX = /^[a-zA-Z0-9_-]{4,16}$/

// GET /api/boards/[slug]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = params

    if (!SLUG_REGEX.test(slug)) {
      return NextResponse.json({ error: 'Board tidak ditemukan' }, { status: 404 })
    }

    const board = await prisma.board.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            filePath: true,
            width: true,
            height: true,
            position: true,
            uploadedAt: true,
          },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board tidak ditemukan' }, { status: 404 })
    }

    // Update lastAccessedAt (fire and forget)
    prisma.board
      .update({ where: { id: board.id }, data: { lastAccessedAt: new Date() } })
      .catch(console.error)

    // Never return editToken or email in GET
    const { editToken, email, ...safeBoard } = board
    void editToken
    void email

    return NextResponse.json(safeBoard)
  } catch (err) {
    console.error('[GET /api/boards/[slug]]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

const PatchBoardSchema = z.object({
  title: z.string().min(1).max(100),
  editToken: z.string().uuid(),
})

// PATCH /api/boards/[slug]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { slug } = params
    const body = await request.json()
    const parsed = PatchBoardSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Input tidak valid', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, editToken } = parsed.data

    const board = await prisma.board.findUnique({ where: { slug } })

    if (!board) {
      return NextResponse.json({ error: 'Board tidak ditemukan' }, { status: 404 })
    }

    if (board.editToken !== editToken) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 403 })
    }

    const updated = await prisma.board.update({
      where: { id: board.id },
      data: { title: title.trim() },
      select: { slug: true, title: true },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PATCH /api/boards/[slug]]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
