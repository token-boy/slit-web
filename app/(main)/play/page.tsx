'use client'

import { NextPage } from 'next'

import { Button } from '@/components/ui/button'
import useSignAndSendTx from '@/hooks/use-sign-and-sign-tx'
import { CHIPS_RATE, SOL_DECIMALS } from '@/lib/constants'
import { useEndpoint } from '@/lib/request'

import GameList from './_components/GameList'
import FilterBar from './_components/FilterBar'
import CreateGameButton from './_components/CreateGameButton'

const PlayPage: NextPage = () => {
  const { loading: tradeLoading, signAndSendTx } = useSignAndSendTx()

  const { loading: depositLoading, runAsync: deposit } = useEndpoint(
    'v1/chips',
    {
      method: 'POST',
      payload: {
        amount: (CHIPS_RATE * SOL_DECIMALS).toString(),
      },
    }
  )

  return (
    <div className="px-5 py-8">
      <div className="flex-between mb-8">
        <h1 className="text-3xl font-bold">Game Hall</h1>
        <div className="flex items-center">
          <Button
            id="join"
            className="mr-4"
            loading={depositLoading || tradeLoading}
            onClick={async () => {
              const { tx } = await deposit()
              await signAndSendTx(tx)
            }}
          >
            Deposit
          </Button>
          <CreateGameButton />
        </div>
      </div>
      <FilterBar />
      <GameList />
    </div>
  )
}

export default PlayPage
