'use client'

import Image from 'next/image'
import { useState } from 'react'
import { type ImageData } from '@/components/BoardView'
import styles from './MasonryGrid.module.css'

interface MasonryGridProps {
  images: ImageData[]
  isOwner: boolean
  onDeleteImage: (id: number) => void
}

export function MasonryGrid({ images, isOwner, onDeleteImage }: MasonryGridProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (deletingId) return
    setDeletingId(id)
    await onDeleteImage(id)
    setDeletingId(null)
  }

  return (
    <div className={styles.grid}>
      {images.map(image => (
        <div key={image.id} className={styles.item}>
          <Image
            src={image.filePath}
            alt=""
            width={image.width}
            height={image.height}
            className={styles.img}
            unoptimized={false}
          />
          {isOwner && (
            <button
              type="button"
              className={`${styles.deleteBtn} ${deletingId === image.id ? styles.deleting : ''}`}
              onClick={() => handleDelete(image.id)}
              disabled={deletingId === image.id}
              aria-label="Hapus gambar ini"
            >
              {deletingId === image.id ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.spin}>
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="25" strokeDashoffset="5"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 4h12M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4l.5 9h5l.5-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
