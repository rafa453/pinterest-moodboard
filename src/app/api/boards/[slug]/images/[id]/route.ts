import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

interface Params {
  params: { slug: string; id: string }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { slug, id } = params
    const imageId = parseInt(id, 10)

    if (isNaN(imageId)) {
      return NextResponse.json({ error: 'ID gambar tidak valid' }, { status: 400 })
    }

    const editToken = request.headers.get('x-edit-token')
    if (!editToken) {
      return NextResponse.json({ error: 'Token diperlukan' }, { status: 401 })
    }

    const board = await prisma.board.findUnique({ where: { slug } })

    if (!board) {
      return NextResponse.json({ error: 'Board tidak ditemukan' }, { status: 404 })
    }

    if (board.editToken !== editToken) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 403 })
    }

    const image = await prisma.image.findFirst({
      where: { id: imageId, boardId: board.id },
    })

    if (!image) {
      return NextResponse.json({ error: 'Gambar tidak ditemukan' }, { status: 404 })
    }

    // Delete from Vercel Blob
    await del(image.filePath)

    // Delete from DB
    await prisma.image.delete({ where: { id: imageId } })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /api/boards/[slug]/images/[id]]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
