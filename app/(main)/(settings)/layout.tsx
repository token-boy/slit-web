'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col lg:flex-row justify-center mt-4 lg:mt-8">
      <div className="flex lg:flex-col gap-2 lg:gap-1 max-lg:border-b lg:border-r px-4 py-2">
        <Link
          href="/profile"
          className={clsx('hover:underline', {
            underline: pathname === '/profile',
          })}
        >
          Profile
        </Link>
        <Link
          href="/billing"
          className={clsx('hover:underline', {
            underline: pathname === '/billing',
          })}
        >
          Billing
        </Link>
        <Link
          href="/balance"
          className={clsx('hover:underline', {
            underline: pathname === '/balance',
          })}
        >
          Balance
        </Link>
      </div>
      <div className="px-4">{children}</div>
    </div>
  )
}
