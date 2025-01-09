'use client'

import WalletConnector from '@/components/WalletConnector'
import { useContext } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { AccountContext } from '@/lib/providers'
import Link from 'next/link'

const Header = () => {
  const { account } = useContext(AccountContext)

  return (
    <header className="bg-gray-800 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-yellow-400">
          Slit
        </Link>
        <nav className="hidden md:flex space-x-4 items-center">
          <Link
            href="/play"
            className="text-gray-300 hover:text-yellow-400 transition-colors"
          >
            Play
          </Link>
          <a
            href="#community"
            className="text-gray-300 hover:text-yellow-400 transition-colors"
          >
            Guides
          </a>
          <a
            href="#start"
            className="text-gray-300 hover:text-yellow-400 transition-colors"
          >
            App
          </a>
          {account ? (
            <Button>
              <Image
                src={account.provider.logo}
                alt={account.provider.name}
                width={16}
                height={16}
              />
              {account.address.slice(0, 5)}...{account.address.slice(-3)}
            </Button>
          ) : (
            <WalletConnector />
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
