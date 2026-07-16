import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BoardView } from '@/components/BoardView'

interface BoardPageProps {
  params: { slug: string }
}

async function getBoardData(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/boards/${slug}`, { cache: 'no-store' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch board')
  return res.json()
}

export async function generateMetadata({ params }: BoardPageProps): Promise<Metadata> {
  const board = await getBoardData(params.slug)
  if (!board) return { title: 'Board tidak ditemukan' }
  return {
    title: board.title,
    description: `Lihat moodboard "${board.title}" — ${board.images.length} gambar`,
  }
}

export default async function BoardPage({ params }: BoardPageProps) {
  const board = await getBoardData(params.slug)
  if (!board) notFound()

  return <BoardView board={board} />
}
