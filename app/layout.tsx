import type { Metadata } from 'next'

import { AccountProvider } from '@/lib/providers'
import { Toaster } from '@/components/ui/toaster'

import './globals.css'

export const metadata: Metadata = {
  title: 'Slit Game',
  description: 'An on-chain board game full of endless fun',
  openGraph: {
    title: 'Slit Game',
    type: 'website',
    url: 'https://slitgame.com',
    images: [
      {
        url: '/logo.webp',
        width: 800,
        height: 600,
        alt: 'Slit Game',
      },
    ],
  },
  icons: [
    {
      rel: 'icon',
      type: 'image/webp',
      url: '/logo.webp',
    },
    {
      rel: 'apple-touch-icon',
      type: 'image/webp',
      url: '/logo.webp',
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <AccountProvider>{children}</AccountProvider>
        <Toaster />
      </body>
    </html>
  )
}
