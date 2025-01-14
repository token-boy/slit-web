'use client'

import { Button } from '@/components/ui/button'
import useSignAndSendTx from '@/hooks/use-sign-and-sign-tx'
import { CHIPS_RATE, SOL_DECIMALS } from '@/lib/constants'
import { useEndpoint } from '@/lib/request'
import dynamic from 'next/dynamic'

const Game = dynamic(() => import('./Game'), { ssr: false })

function App() {
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
    <div id="app">
      <Game />
      <Button
        id="join"
        style={{display: 'none'}}
        loading={depositLoading || tradeLoading}
        className="fixed top-0 right-20"
        onClick={async () => {
          const { tx } = await deposit()
          await signAndSendTx(tx)
        }}
      >
        Deposit
      </Button>
    </div>
  )
}

export default App
