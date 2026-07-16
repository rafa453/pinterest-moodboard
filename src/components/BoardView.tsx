'use client'

import { useEffect, useState } from 'react'
import { BoardHeader } from '@/components/BoardHeader'
import { MasonryGrid } from '@/components/MasonryGrid'
import { UploadZone } from '@/components/UploadZone'
import { useToast } from '@/components/ui/Toast'
import styles from './BoardView.module.css'

export interface ImageData {
  id: number
  filePath: string
  width: number
  height: number
  position: number
  uploadedAt: string
}

interface BoardData {
  id: number
  slug: string
  title: string
  createdAt: string
  images: ImageData[]
}

interface BoardViewProps {
  board: BoardData
}

export function BoardView({ board }: BoardViewProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState(board.title)
  const [images, setImages] = useState<ImageData[]>(board.images)
  const [editToken, setEditToken] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  // Detect ownership from localStorage (client-side only)
  useEffect(() => {
    const token = localStorage.getItem(`token:${board.slug}`)
    if (token) {
      setEditToken(token)
      setIsOwner(true)
    }
  }, [board.slug])

  const handleTitleSave = async (newTitle: string) => {
    if (!editToken || newTitle === title) return

    try {
      const res = await fetch(`/api/boards/${board.slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle, editToken }),
      })

      if (!res.ok) throw new Error('Gagal menyimpan judul')

      setTitle(newTitle)
      toast('Judul berhasil diperbarui', 'success')
    } catch {
      toast('Gagal menyimpan judul', 'error')
    }
  }

  const handleImageUploaded = (image: ImageData) => {
    setImages(prev => [...prev, image])
  }

  const handleImageDeleted = async (imageId: number) => {
    if (!editToken) return

    try {
      const res = await fetch(`/api/boards/${board.slug}/images/${imageId}`, {
        method: 'DELETE',
        headers: { 'x-edit-token': editToken },
      })

      if (!res.ok) throw new Error('Gagal menghapus gambar')

      setImages(prev => prev.filter(img => img.id !== imageId))
      toast('Gambar dihapus', 'success')
    } catch {
      toast('Gagal menghapus gambar', 'error')
    }
  }

  return (
    <div className={styles.page}>
      <BoardHeader
        slug={board.slug}
        title={title}
        isOwner={isOwner}
        imageCount={images.length}
        onTitleSave={handleTitleSave}
      />

      <main className={styles.main}>
        {images.length === 0 && !isOwner ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>Board ini masih kosong.</p>
          </div>
        ) : (
          <MasonryGrid
            images={images}
            isOwner={isOwner}
            onDeleteImage={handleImageDeleted}
          />
        )}

        {isOwner && (
          <UploadZone
            slug={board.slug}
            editToken={editToken!}
            imageCount={images.length}
            onImageUploaded={handleImageUploaded}
          />
        )}
      </main>
    </div>
  )
}
