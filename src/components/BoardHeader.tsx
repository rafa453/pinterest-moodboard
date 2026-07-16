'use client'

import { useRef, useState } from 'react'
import { RecoveryModal } from '@/components/RecoveryModal'
import styles from './BoardHeader.module.css'

interface BoardHeaderProps {
  slug: string
  title: string
  isOwner: boolean
  imageCount: number
  onTitleSave: (title: string) => Promise<void>
}

export function BoardHeader({ slug, title, isOwner, imageCount, onTitleSave }: BoardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleTitleClick = () => {
    if (!isOwner) return
    setEditValue(title)
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleTitleSave = async () => {
    if (!editValue.trim()) return
    setIsSaving(true)
    await onTitleSave(editValue.trim())
    setIsEditing(false)
    setIsSaving(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSave()
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(title)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      window.prompt('Salin link ini:', url)
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleKeyDown}
              className={styles.titleInput}
              maxLength={100}
              disabled={isSaving}
              aria-label="Edit judul board"
            />
          ) : (
            <h1
              className={`${styles.title} ${isOwner ? styles.titleEditable : ''}`}
              onClick={handleTitleClick}
              title={isOwner ? 'Klik untuk edit judul' : undefined}
            >
              {title}
            </h1>
          )}
          <span className={styles.count}>{imageCount} gambar</span>
        </div>

        <div className={styles.actions}>
          {!isOwner && (
            <button
              type="button"
              className={styles.recoverLink}
              onClick={() => setRecoveryOpen(true)}
            >
              Pulihkan akses edit
            </button>
          )}
          <button
            type="button"
            id="share-board-btn"
            className={styles.shareBtn}
            onClick={handleShare}
            aria-live="polite"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Tersalin!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M11 5V3.5A1.5 1.5 0 009.5 2H3.5A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Salin Link
              </>
            )}
          </button>
        </div>
      </header>

      <RecoveryModal
        slug={slug}
        isOpen={recoveryOpen}
        onClose={() => setRecoveryOpen(false)}
      />
    </>
  )
}
