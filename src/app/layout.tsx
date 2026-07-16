import type { Metadata } from 'next'
import '@/styles/globals.css'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: {
    template: '%s | Moodboard',
    default: 'Moodboard Generator',
  },
  description: 'Buat dan bagikan moodboard bergaya Pinterest tanpa perlu daftar akun.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
