import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

const CLEANUP_DAYS = 90

export async function GET(request: NextRequest) {
  // Validate cron secret
  const authHeader = request.headers.get('authorization')
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - CLEANUP_DAYS)

    const staleBoards = await prisma.board.findMany({
      where: { lastAccessedAt: { lt: cutoff } },
      include: { images: { select: { filePath: true } } },
    })

    let deletedCount = 0

    for (const board of staleBoards) {
      // Delete images from Vercel Blob
      const blobUrls = board.images.map(img => img.filePath)
      if (blobUrls.length > 0) {
        await del(blobUrls).catch(err =>
          console.error(`Failed to delete blobs for board ${board.slug}:`, err)
        )
      }

      // Delete board (cascades to images in DB)
      await prisma.board.delete({ where: { id: board.id } })
      deletedCount++
    }

    console.log(`[Cleanup] Deleted ${deletedCount} stale boards (cutoff: ${cutoff.toISOString()})`)

    return NextResponse.json({
      deleted: deletedCount,
      cutoff: cutoff.toISOString(),
    })
  } catch (err) {
    console.error('[GET /api/cron/cleanup]', err)
    return NextResponse.json({ error: 'Cleanup gagal' }, { status: 500 })
  }
}
