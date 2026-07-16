'use client'

import { useRef, useState } from 'react'
import { type ImageData } from '@/components/BoardView'
import { useToast } from '@/components/ui/Toast'
import styles from './UploadZone.module.css'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024
const MAX_IMAGES = 10

interface UploadZoneProps {
  slug: string
  editToken: string
  imageCount: number
  onImageUploaded: (image: ImageData) => void
}

interface FileError {
  name: string
  error: string
}

export function UploadZone({ slug, editToken, imageCount, onImageUploaded }: UploadZoneProps) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [fileErrors, setFileErrors] = useState<FileError[]>([])

  const isFull = imageCount >= MAX_IMAGES

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Format tidak didukung. Gunakan JPEG, PNG, atau WebP.'
    }
    if (file.size > MAX_SIZE) {
      return 'File terlalu besar (maks. 5MB)'
    }
    return null
  }

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return

    const available = MAX_IMAGES - imageCount
    const filesToUpload = files.slice(0, available)
    const errors: FileError[] = []
    let done = 0

    // Client-side validation
    const validFiles = filesToUpload.filter(file => {
      const err = validateFile(file)
      if (err) {
        errors.push({ name: file.name, error: err })
        return false
      }
      return true
    })

    if (validFiles.length === 0) {
      setFileErrors(errors)
      return
    }

    if (files.length > available) {
      toast(`Hanya ${available} slot tersisa. ${files.length - available} gambar dilewati.`, 'info')
    }

    setIsUploading(true)
    setProgress({ done: 0, total: validFiles.length })
    setFileErrors([])

    // Sequential upload
    for (const file of validFiles) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch(`/api/boards/${slug}/images`, {
          method: 'POST',
          headers: { 'x-edit-token': editToken },
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          errors.push({ name: file.name, error: data.error || 'Upload gagal' })
        } else {
          const image = await res.json()
          onImageUploaded(image)
        }
      } catch {
        errors.push({ name: file.name, error: 'Koneksi gagal' })
      }

      done++
      setProgress({ done, total: validFiles.length })
    }

    setIsUploading(false)
    setProgress(null)
    setFileErrors(errors)

    const successCount = validFiles.length - errors.length
    if (successCount > 0) {
      toast(`${successCount} gambar berhasil diunggah`, 'success')
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    uploadFiles(Array.from(files))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  if (isFull) {
    return (
      <div className={styles.fullMessage}>
        Board sudah penuh (maks. {MAX_IMAGES} gambar)
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.zone} ${isDragging ? styles.dragging : ''} ${isUploading ? styles.uploading : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload gambar"
        onKeyDown={e => e.key === 'Enter' && !isUploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className={styles.hiddenInput}
          onChange={e => handleFiles(e.target.files)}
          tabIndex={-1}
          aria-hidden="true"
        />

        {isUploading && progress ? (
          <div className={styles.progressState}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
            <p className={styles.progressText}>
              Mengunggah {progress.done} dari {progress.total}...
            </p>
          </div>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.icon}>
              <path d="M12 16V8M12 8L9 11M12 8l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className={styles.zoneText}>Drag & drop gambar ke sini, atau klik untuk pilih</p>
            <p className={styles.zoneSub}>
              JPEG, PNG, WebP · maks. 5MB per file · {MAX_IMAGES - imageCount} slot tersisa
            </p>
          </>
        )}
      </div>

      {fileErrors.length > 0 && (
        <ul className={styles.errorList} role="list">
          {fileErrors.map((fe, i) => (
            <li key={i} className={styles.errorItem}>
              <span className={styles.errorName}>{fe.name}:</span> {fe.error}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
