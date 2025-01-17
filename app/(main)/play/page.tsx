'use client'

import { NextPage } from 'next'

import { Button } from '@/components/ui/button'
import useSignAndSendTx from '@/hooks/use-sign-and-sign-tx'
import { CHIPS_RATE, SOL_DECIMALS } from '@/lib/constants'
import { useEndpoint } from '@/lib/request'

import FilterBar from './_components/FilterBar'
import CreateGameButton from './_components/CreateGameButton'
import GameCard from './_components/GameCard'

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

  const { data: boards = [], refresh } = useEndpoint('v1/boards', {
    method: 'GET',
    manual: false,
  })

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
