import type { Metadata } from 'next'
import { Space_Grotesk, Archivo } from 'next/font/google'
import '@/styles/globals.css'
import { ToastProvider } from '@/components/ui/Toast'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

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
    <html lang="id" className={`${spaceGrotesk.variable} ${archivo.variable}`}>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
