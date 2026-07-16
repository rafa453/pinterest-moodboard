'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import styles from './RecoveryModal.module.css'

interface RecoveryModalProps {
  slug: string
  isOpen: boolean
  onClose: () => void
}

export function RecoveryModal({ slug, isOpen, onClose }: RecoveryModalProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [emailError, setEmailError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')

    if (!email.trim() || !email.includes('@')) {
      setEmailError('Masukkan alamat email yang valid')
      return
    }

    setIsSubmitting(true)

    try {
      await fetch(`/api/boards/${slug}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Always show success regardless of actual result (anti-enumeration)
      setIsDone(true)
    } catch {
      setIsDone(true) // Show success even on network error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setEmail('')
      setIsDone(false)
      setEmailError('')
    }, 200)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Pulihkan akses edit"
    >
      {isDone ? (
        <div className={styles.success}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="15" stroke="var(--success)" strokeWidth="2"/>
            <path d="M10 16l4 4 8-8" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className={styles.successText}>
            Kalau email ini terdaftar, token sudah dikirim.
          </p>
          <p className={styles.successSub}>
            Cek inbox (dan folder spam) kamu.
          </p>
          <Button onClick={handleClose} variant="ghost" className={styles.closeBtn}>
            Tutup
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <p className={styles.description}>
            Masukkan email yang kamu daftarkan saat membuat board ini.
            Token edit akan dikirim ke sana.
          </p>
          <Input
            id="recovery-email"
            type="email"
            label="Alamat email"
            placeholder="email@kamu.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={emailError}
            disabled={isSubmitting}
            autoFocus
          />
          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              id="recovery-submit-btn"
              isLoading={isSubmitting}
            >
              Kirim Token
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
