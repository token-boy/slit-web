import type { Metadata } from 'next'

import { AccountProvider } from '@/lib/providers'
import { Toaster } from '@/components/ui/toaster'

import './globals.css'

export const metadata: Metadata = {
  title: 'Slit Game',
  description: 'An on-chain board game full of endless fun',
  icons: [
    {
      rel: 'icon',
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
