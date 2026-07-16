import Link from 'next/link'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Board tidak ditemukan</h1>
        <p className={styles.message}>
          Board ini mungkin sudah dihapus, atau link yang kamu buka salah.
        </p>
        <Link href="/" className={styles.link}>
          Buat board baru →
        </Link>
      </div>
    </main>
  )
}
