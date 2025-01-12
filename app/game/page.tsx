'use client'

import { Button } from '@/components/ui/button'
import useSignAndSendTx from '@/hooks/use-sign-and-sign-tx'
import { CHIPS_RATE, SOL_DECIMALS } from '@/lib/constants'
import { AccountContext } from '@/lib/providers'
import { useEndpoint } from '@/lib/request'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useContext } from 'react'
import { wsconnect, jwtAuthenticator } from '@nats-io/nats-core'
import { jetstream } from '@nats-io/jetstream'

const Game = dynamic(() => import('./Game'), { ssr: false })

function App() {
  const params = useSearchParams()

  const { loading: tradeLoading, signAndSendTx } = useSignAndSendTx()

  const { account } = useContext(AccountContext)

  const { loading: depositLoading, runAsync: deposit } = useEndpoint(
    'v1/chips',
    {
      method: 'POST',
      payload: {
        amount: (CHIPS_RATE * SOL_DECIMALS).toString(),
      },
    }
  )

  const { loading: sitLoading, runAsync: sit } = useEndpoint('v1/sit', {
    method: 'POST',
  })

  const { loading: joinLoading, runAsync: join } = useEndpoint('v1/play', {
    method: 'POST',
  })

  const consume = async (gsKey: string) => {
    const nc = await wsconnect({
      servers: 'wss://nats.mxsyx.site',
      authenticator: jwtAuthenticator(
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJlZDI1NTE5LW5rZXkifQ.eyJqdGkiOiJHWEdZRFBNWVNLNUpWNTdNNERRMk00R0hOS0lMNk8zRzVVREVLV1VZV1ZXQ1JVS01DRTJRIiwiaWF0IjoxNzM2NzAxNDU2LCJpc3MiOiJBQ1AzVjdMN1VMRkpKTkFHNjZTNlIyUkxWTUM3TkVPM1VNQklJSUdBUEFPVTVTV1c3V01CWTJNVSIsIm5hbWUiOiJwbGF5ZXIiLCJzdWIiOiJVQURWVVI3NDZHVEdIQkpTS0dKTFlUSU5aTFZBNEs2Nlg2RUo1VlBJSFNISE5PTUdNSVJSMzU1RSIsIm5hdHMiOnsicHViIjp7ImFsbG93IjpbIiRKUy5BQ0suZ2FtZS5cdTAwM2UiLCIkSlMuQVBJLkNPTlNVTUVSLklORk8uZ2FtZS4qIiwiJEpTLkFQSS5DT05TVU1FUi5NU0cuTkVYVC5nYW1lLioiXX0sInN1YiI6e30sInN1YnMiOi0xLCJkYXRhIjotMSwicGF5bG9hZCI6LTEsInR5cGUiOiJ1c2VyIiwidmVyc2lvbiI6Mn19.qrlilvmXy07me7cWwh4maOXfG31oOpqJS0IWMKjvSHTS7X2dlt-4alAsUtTd4XkoRgyKf8UgcU6_7jmIF73_CA',
        new TextEncoder().encode(
          'SUAOIUBYVGC73REGMCECKEURR2YQ3S4RVQSJEOT3XLKF5R73MZKVGZ4D4U'
        )
      ),
    })

    const js = jetstream(nc)
    const c = await js.consumers.get('game', gsKey)
    return c.consume()
  }

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
        loading={joinLoading || tradeLoading || sitLoading}
        className="fixed top-0 right-0"
        onClick={async () => {
          const { tx, gsKey } = await join({
            boardId: params.get('id') as string,
            chips: 100 * SOL_DECIMALS,
          })
          await signAndSendTx(tx, account?.provider.mount)
          const ms = await consume(gsKey)
          setTimeout(() => sit({ gsKey }), 3000)
          for await (const m of ms) {
            console.log(m.string())
            m.ackAck()
          }
        }}
      >
        Join
      </Button>
    </div>
  )
}

export default App
