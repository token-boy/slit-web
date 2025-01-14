import { GameObjects, Scene } from 'phaser'
import { createButton } from '../factory'
import { SOL_DECIMALS } from '@/lib/constants'
import { signAndSendTx } from '@/hooks/use-sign-and-sign-tx'
import { jwtAuthenticator, wsconnect } from '@nats-io/nats-core'
import { ConsumerMessages, jetstream } from '@nats-io/jetstream'
import { getUrl, request } from '@/lib/request'

export enum GameCode {
  Error = 0,
  Sync = 1,
}

interface GlobalState {
  players: { hands?: [number, number]; chips: number }[]
}

interface Sync {
  code: GameCode.Sync
  globalState: GlobalState
}

type Message = Sync

class MainGame extends Scene {
  background: GameObjects.Image
  deck: GameObjects.Image[] = []
  cursor: GameObjects.Sprite
  boardId: string
  players: GameObjects.Image[] = []
  globalState: GlobalState = {
    players: [],
  }

  constructor() {
    super('MainGame')
    this.boardId = new URLSearchParams(location.search).get('id')!
  }

  size() {
    return {
      width: this.sys.game.config.width as number,
      height: this.sys.game.config.height as number,
    }
  }

  /**
   * Consumes messages from a specified JetStream consumer.
   *
   * Establishes a WebSocket connection to the NATS server using JWT authentication,
   * retrieves the JetStream consumer for the given stream and name, and begins consuming
   * messages.
   *
   * @param stream - The name of the stream from which to consume messages.
   * @param name - The name of the consumer within the stream.
   * @returns A promise that resolves with the consumer's message iterator.
   */
  async consume(stream: string, name: string) {
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

  /**
   * Sends a ping request to the server.
   *
   * This is a "noop" endpoint that simply responds with a 200 status code.
   * It can be used to keep session alive.
   */
  async ping() {
    request(getUrl('v1/game/ping'))
  }

  /**
   * Enters the game for the given board ID.
   *
   * This will send a request to the server to enter the game, and then
   * establish a WebSocket connection to the NATS server to receive updates
   * for that game. It will also set up a recurring ping request to the server
   * to keep session alive.
   */
  async enter() {
    await request(getUrl('v1/game/:boardId/enter', { boardId: this.boardId }))
    const sessionId = new URLSearchParams(document.cookie).get('sessionId')
    const ms = await this.consume(
      `states_${this.boardId}`,
      sessionId!.split(':').pop()!
    )
    this.handleMessages(ms, false)
    setInterval(this.ping, 15000)
  }

  /**
   * Handles messages from the specified JetStream consumer.
   *
   * @param ms - The message iterator from the consumer.
   * @param isAck - Whether to acknowledge each message.
   */
  async handleMessages(ms: ConsumerMessages, isAck: boolean) {
    for await (const m of ms) {
      const message = m.json<Message>()
      switch (message.code) {
        case GameCode.Sync: {
          break
        }
      }
      console.log(m.string())
      if (isAck) {
        m.ackAck()
      }
    }
  }

  /**
   * Initiates a play action in the game.
   *
   * Sends a request to the server to play a game for the current board ID with a specified
   * amount of chips. Signs and sends the transaction received from the server. Then, consumes
   * messages from the 'game' stream using the provided seat key and handles these messages.
   *
   * @returns The seat key used to play the game.
   */
  async play() {
    const { tx, seatKey } = await request(
      getUrl('v1/game/:boardId/play', { boardId: this.boardId }),
      {
        method: 'POST',
        payload: {
          chips: 100 * SOL_DECIMALS,
        },
      }
    )
    await signAndSendTx(tx)
    const ms = await this.consume('game', seatKey)
    this.handleMessages(ms, true)
    return seatKey
  }

  /**
   * Sends a request to the server to sit at the given seat key.
   *
   * This will send a request to the server to sit at the given seat key.
   * @param seatKey - The seat key to sit at.
   */
  sit(seatKey: string) {
    return request(getUrl('v1/game/sit'), {
      method: 'POST',
      payload: { seatKey },
    })
  }

  deal() {
    // const trigger = this.add.image(400, 600, 'Deck').setInteractive()

    // // const cardWidth = 300
    // const cardHeight = 420
    // const gap = 20
    // const deskX = width / 2 - (gap * 51) / 2
    // const deskY = height / 2

    // for (let i = 0; i < 52; i++) {
    //   this.deck.push(
    //     this.add.image(deskX + gap * i, deskY, 'Deck').setDepth((52 - i) * 10)
    //   )
    // }

    // trigger.on('pointerdown', () => {
    //   const card1 = this.deck.shift()
    //   card1?.setTexture('HeartsAce')
    //   this.tweens.add({
    //     targets: card1,
    //     x: width / 2 - gap,
    //     y: height - cardHeight,
    //     duration: 500,
    //     ease: 'Power2',
    //   })
    //   card1?.setDepth(99)

    //   const card2 = this.deck.shift()
    //   card2?.setTexture('ClubsKing')
    //   this.tweens.add({
    //     targets: card2,
    //     x: width / 2,
    //     y: height - cardHeight,
    //     duration: 500,
    //     ease: 'Power2',
    //   })
    //   card2?.setDepth(100)
    // })
  }

  create() {
    const { width, height } = this.size()

    // Game background
    this.background = this.add
      .image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(width, height)

    // Custom cursor
    this.cursor = this.add
      .sprite(100, 100, 'cursorx')
      .setOrigin(0, 0)
      .setDisplaySize(60, 60)
      .setDepth(999)
    this.input.setDefaultCursor('none')

    // Play Button
    createButton({
      scene: this,
      x: width / 2,
      y: height - 500,
      width: 150,
      height: 75,
      label: 'Play',
      colors: ['#ad7111', '#d18c26', '#f7a73a'],
      onClick: this.play,
    })
  }

  update() {
    // Update position of custom cursor
    this.cursor.x = this.input.x
    this.cursor.y = this.input.y
  }
}

export default MainGame
