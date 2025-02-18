'use client'

import { useContext, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AccountContext } from '@/lib/providers'
import { useEndpoint } from '@/lib/request'
import {
  Account,
  getConnector,
  getProviders,
  WalletProvider,
} from '@/lib/wallet'
import Image from 'next/image'
import { useBoolean } from 'ahooks'
import useSignAndSendTx from '@/hooks/use-sign-and-sign-tx'
import { IS_DEV } from '@/lib/constants'
import { isMobileDevice } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const WalletConnector: React.FC<{ children?: React.ReactNode }> = (props) => {
  const [wallets, setWallets] = useState<
    (WalletProvider & { isInstalled: boolean })[]
  >([])

  const { setAccount } = useContext(AccountContext)

  const [activeWallet, setActiveWallet] = useState<string | undefined>()
  const [open, { toggle }] = useBoolean(false)

  const { runAsync: signIn } = useEndpoint('v1/sessions', {
    method: 'POST',
  })

  // TODO create player
  const { signAndSendTx } = useSignAndSendTx(() => {})
  const { runAsync: createPlayer } = useEndpoint('v1/players', {
    method: 'POST',
  })

  // TODO Integrate Wallet Connect
  const connect = async (wallet: (typeof wallets)[0]) => {
    if (!wallet.isInstalled) {
      window.open(wallet.url)
      return
    }

    setActiveWallet(wallet.mount)
    const connector = await getConnector(wallet.mount)

    try {
      await connector.connect()

      const timestamp = Date.now().toString()
      const { signature } = await connector.signMessage(
        new TextEncoder().encode(timestamp)
      )

      const storage = IS_DEV ? sessionStorage : localStorage

      const { accessToken, isNew } = await signIn({
        address: connector.publicKey.toBase58(),
        timestamp,
        signature: btoa(String.fromCharCode.apply(null, signature)),
      })
      storage.setItem('accessToken', accessToken)
      sessionStorage.setItem('providerMount', wallet.mount)

      // Becareful, don't move the following block under setAccount,
      // otherwise Promise resolve will not be triggered.
      if (isNew) {
        try {
          const { tx } = await createPlayer()
          signAndSendTx(tx)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {}
      }

      const account: Account = {
        address: connector.publicKey.toBase58(),
        provider: {
          name: wallet.name,
          logo: wallet.logo,
          mount: wallet.mount,
        },
      }
      setAccount(account)
      storage.setItem('account', JSON.stringify(account))

      toggle()
    } catch (error) {
      console.error(error)
    } finally {
      setActiveWallet(undefined)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={toggle}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect wallet</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {wallets.map((wallet) => (
              <Button
                key={wallet.mount}
                onClick={() => connect(wallet)}
                loading={activeWallet === wallet.mount}
              >
                <Image
                  src={wallet.logo}
                  alt={wallet.name}
                  width={16}
                  height={16}
                />
                {wallet.isInstalled ? '' : 'Install '}
                {wallet.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {props.children ?? (
        <Button
          onClick={() => {
            if (isMobileDevice()) {
              const providers = getProviders()
              if (providers.length) {
                connect({ ...providers[0], isInstalled: true })
              } else {
                toast({ title: 'No wallet found' })
              }
            } else {
              const providers = getProviders()
              setWallets(
                providers.map((provider) => ({
                  ...provider,
                  isInstalled: window.hasOwnProperty(provider.mount),
                }))
              )
              toggle()
            }
          }}
        >
          Connect
        </Button>
      )}
    </>
  )
}

export default WalletConnector
