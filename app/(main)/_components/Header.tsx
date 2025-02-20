'use client'

import Link from 'next/link'

import WalletConnector from '@/components/WalletConnector'

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-yellow-400">
          Slit
        </Link>
        <nav className="md:flex space-x-4 items-center">
          <Link
            href="/play"
            className="text-gray-300 hover:text-yellow-400 transition-colors"
          >
            Play
          </Link>
          <Link
            href="/guides"
            className="text-gray-300 hover:text-yellow-400 transition-colors"
          >
            Guides
          </Link>
          <WalletConnector />
        </nav>
      </div>
    </header>
  )
}

export default Header
