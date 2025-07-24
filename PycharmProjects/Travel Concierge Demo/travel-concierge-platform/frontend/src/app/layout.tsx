import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './emergency-styles.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TravelAI - Smart Travel Assistant',
  description: 'AI-powered travel planning made simple',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
