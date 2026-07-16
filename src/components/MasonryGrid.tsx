'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { type ImageData } from '@/components/BoardView'
import styles from './MasonryGrid.module.css'

interface MasonryGridProps {
  images: ImageData[]
  isOwner: boolean
  onDeleteImage: (id: number) => void
}

export function MasonryGrid({ images, isOwner, onDeleteImage }: MasonryGridProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (deletingId) return
    setDeletingId(id)
    await onDeleteImage(id)
    setDeletingId(null)
  }

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex + 1) % images.length)
  }, [lightboxIndex, images.length])

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)
  }, [lightboxIndex, images.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, goNext, goPrev])

  // Prevent body scroll when lightbox open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null

  return (
    <>
      <div className={styles.grid}>
        {images.map((image, index) => (
          <div key={image.id} className={styles.item}>
            <button
              type="button"
              className={styles.imgBtn}
              onClick={() => openLightbox(index)}
              aria-label={`Lihat gambar ${index + 1}`}
            >
              <Image
                src={image.filePath}
                alt=""
                width={image.width}
                height={image.height}
                className={styles.img}
                unoptimized={false}
              />
              <span className={styles.zoomIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
                </svg>
              </span>
            </button>
            {isOwner && (
              <button
                type="button"
                className={`${styles.deleteBtn} ${deletingId === image.id ? styles.deleting : ''}`}
                onClick={(e) => { e.stopPropagation(); handleDelete(image.id) }}
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

      {/* Lightbox */}
      {lightboxIndex !== null && currentImage && (
        <div
          className={styles.lightboxOverlay}
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Lightbox gambar"
        >
          {/* Counter */}
          <div className={styles.lightboxCounter}>
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Close */}
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={closeLightbox}
            aria-label="Tutup lightbox"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              onClick={(e) => { e.stopPropagation(); goPrev() }}
              aria-label="Gambar sebelumnya"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
          )}

          {/* Image */}
          <div className={styles.lightboxImgWrap} onClick={(e) => e.stopPropagation()}>
            <Image
              src={currentImage.filePath}
              alt=""
              width={currentImage.width}
              height={currentImage.height}
              className={styles.lightboxImg}
              unoptimized={false}
              priority
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxNext}`}
              onClick={(e) => { e.stopPropagation(); goNext() }}
              aria-label="Gambar berikutnya"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  )
}
