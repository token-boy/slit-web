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
  const boardId = params.get('id')

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

  const { runAsync: ping } = useEndpoint('v1/game/ping', {
    method: 'GET',
  })

  useEndpoint('v1/game/:boardId/enter', {
    method: 'POST',
    manual: false,
    ready: !!boardId,
    params: { boardId: boardId! },
    async onSuccess() {
      const sessionId = new URLSearchParams(document.cookie).get('sessionId')
      const ms = await consume(
        `states_${boardId}`,
        sessionId!.split(':').pop()!
      )
      setInterval(ping, 15000)
      for await (const m of ms) {
        console.log(m.string())
      }
    },
  })

  const { loading: joinLoading, runAsync: join } = useEndpoint(
    'v1/game/:boardId/play',
    {
      method: 'POST',
    }
  )

  const { loading: sitLoading, runAsync: sit } = useEndpoint(
    'v1/game/:boardId/sit',
    {
      method: 'POST',
    }
  )

  const consume = async (stream: string, name: string) => {
    const nc = await wsconnect({
      servers: 'wss://nats.mxsyx.site',
      authenticator: jwtAuthenticator(
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJlZDI1NTE5LW5rZXkifQ.eyJqdGkiOiI1WEJIQlJJV1RRUEQzS0FHWU9BQkFGSUNNWUNVV01OM0ZWRVdQUkhDNk1HR0xOUFJXNEhRIiwiaWF0IjoxNzM2NzY3NTUwLCJpc3MiOiJBQ1AzVjdMN1VMRkpKTkFHNjZTNlIyUkxWTUM3TkVPM1VNQklJSUdBUEFPVTVTV1c3V01CWTJNVSIsIm5hbWUiOiJwbGF5ZXIiLCJzdWIiOiJVREg3Qk1aN0c1UllXM1VQNDUyS0FYREtQTERWV0hVSEJISkVEUE9UVkhVR0NONUpOSVMzU1hQRiIsIm5hdHMiOnsicHViIjp7ImFsbG93IjpbIiRKUy5BQ0suZ2FtZS5cdTAwM2UiLCIkSlMuQVBJLkNPTlNVTUVSLklORk8uXHUwMDNlIiwiJEpTLkFQSS5DT05TVU1FUi5NU0cuTkVYVC5cdTAwM2UiXX0sInN1YiI6e30sInN1YnMiOi0xLCJkYXRhIjotMSwicGF5bG9hZCI6LTEsInR5cGUiOiJ1c2VyIiwidmVyc2lvbiI6Mn19.zLFPdQavUBq_PqmtmWyzZ7QlzOKbPE95XzIyW-6yBySalEDLe1UOST3wWPP2Ai1E21qdZFQ5LW4bYfFUPqCxBw',
        new TextEncoder().encode(
          'SUAHZ6WATBMRQIR7K7GCO767NJ6FTILRB526XSWB6JUVW4CDZCR33UTT3Q'
        )
      ),
    })

    const js = jetstream(nc)
    const c = await js.consumers.get(stream, name)
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
          const { tx, seatKey } = await join(
            {
              chips: 100 * SOL_DECIMALS,
            },
            { boardId: boardId! }
          )
          await signAndSendTx(tx, account?.provider.mount)
          const ms = await consume('game', seatKey)
          setTimeout(() => sit({ seatKey }, { boardId: boardId! }), 3000)
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
