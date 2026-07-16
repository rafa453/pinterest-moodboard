import type { Metadata } from 'next'
import { CreateBoardForm } from '@/components/CreateBoardForm'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Buat Board Baru',
  description: 'Buat moodboard visual bergaya Pinterest. Upload gambar, bagikan lewat link unik.',
}

export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.card}>

        {/* Brand mark — purposeful, not decorative */}
        <div className={styles.logoMark} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>Moodboard</h1>
          <p className={styles.subtitle}>
            Upload gambar, susun dalam grid, dan bagikan lewat link unik.
            Tanpa akun, tanpa friksi.
          </p>
        </header>

        <CreateBoardForm />

      </div>
    </main>
  )
}
