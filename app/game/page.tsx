'use client'

import { Button } from '@/components/ui/button'
import useSignAndSendTx from '@/hooks/use-sign-and-sign-tx'
import { CHIPS_RATE, SOL_DECIMALS } from '@/lib/constants'
import { AccountContext } from '@/lib/providers'
import { useEndpoint } from '@/lib/request'
import { useAsyncEffect } from 'ahooks'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useContext } from 'react'

const Game = dynamic(() => import('./Game'), { ssr: false })

function App() {
  const params = useSearchParams()

  const { loading: tradeLoading, signAndSendTx } = useSignAndSendTx()

  const { account } = useContext(AccountContext)

  const { loading: depositLoading, runAsync: deposit } = useEndpoint('v1/chips', {
    method: 'POST',
    payload: {
      amount: (CHIPS_RATE * SOL_DECIMALS).toString(),
    },
  })

  const { loading: joinLoading, runAsync: join } = useEndpoint('v1/play', {
    method: 'POST',
    payload: {
      boardId: params.get('id') as string,
      chips: 100 * SOL_DECIMALS,
    },
  })

  useAsyncEffect(async () => {
    const gsKey = params.get('gsKey')
    console.log(gsKey);
    
    if (gsKey) {
      const url = new URL(process.env.NEXT_PUBLIC_API as string)
      const ws = new WebSocket(`ws://${url.host}/v1/ws?gsKey=${gsKey}`)
      ws.onopen = () => {
        window.ws = ws
        alert('Connected!')
      }
    }
  }, [])

  return (
    <div id="app">
      <Game />
      <Button
        id="join"
        loading={depositLoading || tradeLoading}
        className="fixed top-0 right-20"
        onClick={async () => {
          const { tx } = await deposit()
          await signAndSendTx(tx, account?.provider.mount)
        }}
      >
        Deposit
      </Button>
      <Button
        id="join"
        loading={joinLoading || tradeLoading}
        className="fixed top-0 right-0"
        onClick={async () => {
          const { tx, gsKey } = await join()
          await signAndSendTx(tx, account?.provider.mount)
          const url = new URL(process.env.NEXT_PUBLIC_API as string)
          const ws = new WebSocket(`ws://${url.host}/v1/ws?gsKey=${gsKey}`)
          ws.onopen = () => {
            alert('Connected!')
          }
        }}
      >
        Join
      </Button>
    </div>
  )
}

export default App
