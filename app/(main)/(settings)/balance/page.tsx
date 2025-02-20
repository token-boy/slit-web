'use client'

import { Button } from '@/components/ui/button'
import { DialogHeader, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import useSignAndSendTx from '@/hooks/use-sign-and-sign-tx'
import { toast } from '@/hooks/use-toast'
import { CHIPS_RATE, SOL_DECIMALS } from '@/lib/constants'
import { uiAmount } from '@/lib/game'
import { AccountContext } from '@/lib/providers'
import { useEndpoint } from '@/lib/request'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { useBoolean } from 'ahooks'
import { useContext, useRef } from 'react'

const BalancePage: React.FC = () => {
  const [solInputOpen, setSolInputOpen] = useBoolean(false)
  const solInput = useRef<HTMLInputElement>(null)

  const [chipsInputOpen, setChipsInputOpen] = useBoolean(false)
  const chipsInput = useRef<HTMLInputElement>(null)

  const { account, setAccount } = useContext(AccountContext)

  const { refresh } = useEndpoint('v1/chips', {
    method: 'GET',
    ready: account !== undefined,
    manual: false,
    onSuccess(data) {
      if (!account) {
        return
      }
      account.balance = data.amount
      setAccount({ ...account })
    },
  })

  const { loading: tradeLoading, signAndSendTx } = useSignAndSendTx(refresh)

  const { loading: depositLoading, runAsync: deposit } = useEndpoint(
    'v1/chips',
    {
      method: 'POST',
    }
  )

  const { loading: withdrawLoading, runAsync: withdraw } = useEndpoint(
    'v1/chips',
    {
      method: 'DELETE',
    }
  )

  return (
    <div className='mt-4'>
      {account?.balance && (
        <p className="text-2xl font-semibold">
          {uiAmount(account.balance)} Chips
        </p>
      )}
      <div className="flex gap-2 mt-4">
        <Dialog open={solInputOpen} onOpenChange={setSolInputOpen.toggle}>
          <DialogTrigger asChild>
            <Button className="mr-4 bg-sky-500 hover:bg-sky-600 text-white">
              Deposit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Input sols</DialogTitle>
            </DialogHeader>
            <p>1 SOL = {CHIPS_RATE} Chips</p>
            <Input ref={solInput} placeholder="min 0.001 sol" />
            <DialogFooter>
              <Button
                loading={depositLoading || tradeLoading}
                onClick={async () => {
                  const value = parseFloat(solInput.current!.value)
                  if (isNaN(value) || value < 0.001) {
                    toast({ title: 'Incorrect input' })
                    return
                  }
                  const { tx } = await deposit({
                    amount: (
                      BigInt(value * CHIPS_RATE) * SOL_DECIMALS
                    ).toString(),
                  })
                  await signAndSendTx(tx)
                  setSolInputOpen.setFalse()
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={chipsInputOpen} onOpenChange={setChipsInputOpen.toggle}>
          <DialogTrigger asChild>
            <Button className="mr-4  bg-orange-500 hover:bg-orange-600 text-white">
              Withdraw
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Input chips</DialogTitle>
            </DialogHeader>
            <p>{CHIPS_RATE} Chips = 1 SOL</p>
            <Input ref={chipsInput} placeholder="min 1 chip" />
            <DialogFooter>
              <Button
                loading={withdrawLoading || tradeLoading}
                onClick={async () => {
                  const value = parseFloat(chipsInput.current!.value)
                  if (isNaN(value) || value < 1) {
                    toast({ title: 'Incorrect input' })
                    return
                  }
                  const { tx } = await withdraw({
                    amount: (
                      BigInt(value * CHIPS_RATE) * SOL_DECIMALS
                    ).toString(),
                  })
                  await signAndSendTx(tx)
                  setChipsInputOpen.setFalse()
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default BalancePage
