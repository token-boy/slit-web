'use client'

import { useContext, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { getStorage, isMobileDevice } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { CreditCard, LogOut, User } from 'lucide-react'

const WalletConnector: React.FC<{
  children?: React.ReactNode
  ref?: React.RefObject<HTMLDivElement|null>
}> = (props) => {
  const [wallets, setWallets] = useState<
    (WalletProvider & { isInstalled: boolean })[]
  >([])

  const { account, setAccount } = useContext(AccountContext)

  const [activeWallet, setActiveWallet] = useState<string | undefined>()
  const [open, { toggle }] = useBoolean(false)

  const { runAsync: signIn } = useEndpoint('v1/sessions', {
    method: 'POST',
  })

  const { signAndSendTx } = useSignAndSendTx(() => {})
  const { runAsync: createPlayer } = useEndpoint('v1/players', {
    method: 'POST',
  })

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

      const storage = getStorage()

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

  const disconnect = async () => {
    if (!account) {
      return
    }
    const connector = await getConnector(account.provider.mount)
    if (!connector) {
      return
    }
    await connector.disconnect()
    const storage = getStorage()
    storage.removeItem('account')
    storage.removeItem('accessToken')
    storage.removeItem('providerMount')
    setAccount(undefined)
  }

  return account ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Image
            src={account.provider.logo}
            alt={account.provider.name}
            width={16}
            height={16}
          />
          {account.address.slice(0, 5)}...{account.address.slice(-3)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCard />
          <span>Billing</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect}>
          <LogOut />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
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
      <div
        ref={props.ref}
        className="inline"
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
        {props.children ?? <Button>Connect</Button>}
      </div>
    </>
  )
}

export default WalletConnector
