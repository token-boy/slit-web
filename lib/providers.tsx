'use client'

import React from 'react'

import { Account, getConnector } from '@/lib/wallet'
import { IS_DEV } from './constants'

export const AccountContext = React.createContext<{
  account?: Account
  setAccount: React.Dispatch<React.SetStateAction<Account | undefined>>
}>({
  account: undefined,
  setAccount: function (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    value: React.SetStateAction<Account | undefined>
  ): void {
    throw new Error('Function not implemented.')
  },
})

export const AccountProvider: ReactFC = (props) => {
  const [account, setAccount] = React.useState<Account>()

  React.useEffect(() => {
    const storage = IS_DEV ? sessionStorage : localStorage
    const accountData = storage.getItem('account')
    if (accountData) {
      const account = JSON.parse(accountData) as Account
      getConnector(account.provider.mount)
        .then((connector) => {
          connector.connect().then(() => setAccount(account))
        })
        .catch(() => {
          storage.removeItem('account')
        })
    }
  }, [])

  return (
    <AccountContext.Provider value={{ account, setAccount }}>
      {props.children}
    </AccountContext.Provider>
  )
}
