import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { prisma } from '@/lib/prisma'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_IMAGES = 10

interface Params {
  params: { slug: string }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { slug } = params

    // Validate editToken from header
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

    // Check image count limit
    const imageCount = await prisma.image.count({ where: { boardId: board.id } })
    if (imageCount >= MAX_IMAGES) {
      return NextResponse.json(
        { error: `Board sudah penuh (maks. ${MAX_IMAGES} gambar)` },
        { status: 422 }
      )
    }

    // Parse multipart form
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan di request' }, { status: 400 })
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format tidak didukung. Gunakan JPEG, PNG, atau WebP.' },
        { status: 415 }
      )
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File terlalu besar (maks. 5MB)` },
        { status: 413 }
      )
    }

    // Read buffer and extract dimensions
    const buffer = Buffer.from(await file.arrayBuffer())
    const metadata = await sharp(buffer).metadata()
    const { width, height } = metadata

    if (!width || !height) {
      return NextResponse.json({ error: 'Tidak bisa membaca dimensi gambar' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const filename = `${slug}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: file.type,
    })

    // Save to DB
    const position = imageCount + 1
    const image = await prisma.image.create({
      data: {
        boardId: board.id,
        filePath: blob.url,
        width,
        height,
        position,
      },
      select: {
        id: true,
        filePath: true,
        width: true,
        height: true,
        position: true,
        uploadedAt: true,
      },
    })

    return NextResponse.json(image, { status: 201 })
  } catch (err) {
    console.error('[POST /api/boards/[slug]/images]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
