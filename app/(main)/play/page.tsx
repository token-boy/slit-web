'use client'

import { NextPage } from 'next'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import useSignAndSendTx from '@/hooks/use-sign-and-sign-tx'
import { CHIPS_RATE, SOL_DECIMALS } from '@/lib/constants'
import { useEndpoint } from '@/lib/request'

import FilterBar from './_components/FilterBar'
import CreateGameButton from './_components/CreateGameButton'
import GameCard from './_components/GameCard'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useBoolean } from 'ahooks'
import { toast } from '@/hooks/use-toast'

const PlayPage: NextPage = () => {
  const [chipsInputOpen, setChipsInputOpen] = useBoolean(false)
  const chipsInput = useRef<HTMLInputElement>(null)

  const { loading: tradeLoading, signAndSendTx } = useSignAndSendTx()

  const { loading: depositLoading, runAsync: deposit } = useEndpoint(
    'v1/chips',
    {
      method: 'POST',
    }
  )

  const { data: boards = [], refresh } = useEndpoint('v1/boards', {
    method: 'GET',
    manual: false,
  })

  return (
    <div className="px-5 py-8">
      <div className="flex-between mb-8">
        <h1 className="text-3xl font-bold">Game Hall</h1>
        <div className="flex items-center">
          <Dialog open={chipsInputOpen} onOpenChange={setChipsInputOpen.toggle}>
            <DialogTrigger asChild>
              <Button className="mr-4">Deposit</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Input sols</DialogTitle>
              </DialogHeader>
              <p>1 SOL = {CHIPS_RATE} Chips</p>
              <Input ref={chipsInput} placeholder="min 0.001 sol" />
              <DialogFooter>
                <Button
                  loading={depositLoading || tradeLoading}
                  onClick={async () => {
                    const value = parseFloat(chipsInput.current!.value)
                    if (isNaN(value) || value < 0.001) {
                      toast({ title: 'Incorrect input' })
                      return
                    }
                    const { tx } = await deposit({
                      amount: (BigInt(value * CHIPS_RATE) * SOL_DECIMALS).toString(),
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
          <CreateGameButton onCreated={refresh} />
        </div>
      </div>
      <FilterBar />
      <div>
        <div className="flex flex-wrap items-center justify-between mb-8">
          {boards.map((board) => (
            <GameCard key={board.id} board={board} />
          ))}
        </div>
        <div className="flex justify-center space-x-2">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            上一页
          </Button>
          <span className="py-2 px-4 bg-gray-800 text-white rounded">
            {1} / {1}
          </span>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PlayPage
