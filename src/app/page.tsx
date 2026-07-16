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
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Buat Board Baru</h1>
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
