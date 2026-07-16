'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import styles from './CreateBoardForm.module.css'

export function CreateBoardForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const showEmailWarning = emailTouched && email.trim() === ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || undefined,
          email: email.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal membuat board')
      }

      const { slug, editToken } = await res.json()

      // Store token in localStorage before redirect
      localStorage.setItem(`token:${slug}`, editToken)

      router.push(`/${slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <Input
        id="board-title"
        label="Nama board"
        placeholder="Nama board (opsional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={100}
        disabled={isSubmitting}
        autoFocus
      />

      <Input
        id="board-email"
        label="Email recovery"
        type="email"
        placeholder="Email untuk recovery token (opsional)"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onBlur={() => setEmailTouched(true)}
        disabled={isSubmitting}
      />

      {showEmailWarning && (
        <div className={styles.warning} role="alert">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.warningIcon}>
            <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M8 6v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>
            Tanpa email, token yang hilang tidak bisa dipulihkan.
            Simpan link edit kamu dengan aman.
          </span>
        </div>
      )}

      {error && (
        <p className={styles.error} role="alert">{error}</p>
      )}

      <Button
        type="submit"
        id="create-board-btn"
        isLoading={isSubmitting}
        className={styles.submitBtn}
      >
        Buat Board
      </Button>
    </form>
  )
}
