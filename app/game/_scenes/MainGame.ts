/**
 * Design size: 3840x2160
 */

import { GameObjects, Scene } from 'phaser'
import { createButton } from '../factory'
import { IS_DEV, SOL_DECIMALS } from '@/lib/constants'
import { signAndSendTx } from '@/hooks/use-sign-and-sign-tx'
import { jwtAuthenticator, wsconnect } from '@nats-io/nats-core'
import { ConsumerMessages, jetstream } from '@nats-io/jetstream'
import { getUrl, request } from '@/lib/request'
import Player from './Player'

export enum GameCode {
  Error = 0,
  Sync = 1,
}

interface SeatState {
  playerId: string
  hands?: [number, number]
  chips: number
}

interface GlobalState {
  seats: SeatState[]
}

interface Sync {
  code: GameCode.Sync
  globalState: GlobalState
}

type Message = Sync

interface Seat {
  /**
   * The owner address of the player.
   */
  owner: string

  /**
   * The id of the board.
   */
  boardId: string

  /**
   * The id of the player.
   */
  playerId: string

  /**
   * The amount of chips the player has staked.
   */
  chips: number

  /**
   * `unready`: Wait for the transaction of stake chips to be confirmed.
   * `ready`: The transaction of stake chips has been confirmed.
   * `playing`: Game is in progress.
   * `settling`: Game is settling.
   */
  status: 'unready' | 'ready' | 'playing' | 'settling'
}

class MainGame extends Scene {
  background: GameObjects.Image
  deck: GameObjects.Image[] = []
  cursor: GameObjects.Sprite
  playButton: GameObjects.Container
  sitButton: GameObjects.Container
  players: Player[] = []

  boardId: string
  seatKey: string
  seat: Seat
  globalState: GlobalState = {
    seats: [],
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
    const { seatKey, seat } = await request<{
      seatKey?: string
      seat?: Seat
    }>(getUrl('v1/game/:boardId/enter', { boardId: this.boardId }), {
      method: 'POST',
    })

    const sessionId = new URLSearchParams(document.cookie).get('sessionId')
    const ms = await this.consume(
      `state_${this.boardId}`,
      sessionId!.split(':').pop()!
    )
    this.handleMessages(ms, false)
    setInterval(this.ping, 15000)

    if (seatKey && seat) {
      this.seatKey = seatKey
      this.seat = seat
      if (seat.status === 'ready') {
        this.sitButton.setVisible(true)
      } else if (seat.status === 'playing') {
        const ms = await this.consume(`seat_${this.boardId}`, seatKey)
        this.handleMessages(ms, false)
      }
    } else {
      this.playButton.setVisible(true)
    }
  }

  /**
   * Calculates the positions of players around the game board based on the number of players.
   *
   * Determines the layout of player positions depending on the number of players,
   * adjusting for the current player's seat if applicable. The positions are expressed
   * as a series of x, y coordinates in the game space, with a gap between players.
   *
   * @returns An array of numbers representing the x, y coordinates for players.
   *          Each player is represented by a pair of coordinates. The array length
   *          varies depending on the number of players.
   */
  calcPlayerPositions(len: number) {
    const { width, height } = this.size()

    const gap = 200

    if (len === 1) {
      return [width / 2, gap]
    } else if (len === 2) {
      return [gap, height / 2, width - gap, height / 2]
    } else if (len === 3) {
      return [gap, height / 2, width / 2, gap, width - gap, height / 2]
    } else if (len === 4) {
      return [
        gap,
        height / 2,
        width / 3,
        gap,
        width - width / 3,
        gap,
        width - gap,
        height / 2,
      ]
    } else if (len === 5) {
      return [
        gap,
        height / 2,
        width / 4,
        gap,
        width / 2,
        gap,
        width - width / 4,
        gap,
        width - gap,
        height / 2,
      ]
    } else if (len === 6) {
      return [
        gap,
        height / 2,
        width / 6,
        height / 4,
        width / 3,
        gap,
        width - width / 3,
        gap,
        width - width / 6,
        height / 4,
        width - gap,
        height / 2,
      ]
    } else if (len === 7) {
      return [
        gap,
        height / 2,
        width / 8,
        height / 4,
        width / 4,
        gap,
        width / 2,
        gap,
        width - width / 4,
        gap,
        width - width / 8,
        height / 4,
        width - gap,
        height / 2,
      ]
    } else if (len === 8) {
      return [
        gap,
        height / 2,
        width / 8,
        height / 4,
        width / 5,
        gap,
        width / 2.5,
        gap,
        width - width / 2.5,
        gap,
        width - width / 5,
        gap,
        width - width / 8,
        height / 4,
        width - gap,
        height / 2,
      ]
    } else if (len === 9) {
      return [
        gap,
        height / 2,
        width / 8,
        height / 4,
        width / 5,
        gap,
        width / 3,
        gap,
        width / 2,
        gap,
        width - width / 3,
        gap,
        width - width / 5,
        gap,
        width - width / 8,
        height / 4,
        width - gap,
        height / 2,
      ]
    }

    return []
  }

  async insertPlayer(seatState: SeatState) {
    const positions = this.calcPlayerPositions(this.players.length + 1)

    // Update existing players position
    for (let i = 0; i < positions.length - 2; i += 2) {
      this.players[i / 2].setPosition(positions[i], positions[i + 1])
    }

    const player = new Player({
      scene: this,
      x: positions[positions.length - 2],
      y: positions[positions.length - 1],
      id: seatState.playerId,
      width: 300,
      height: 100,
      avatarUrl: `https://files.mxsyx.site/avatar${this.players.length}.jpeg`,
      nickname: 'Pavel Durov',
      chips: seatState.chips / SOL_DECIMALS,
    })
    this.players.push(player)
    this.load.start()
  }

  async handleSync(globalState: GlobalState) {
    globalState.seats.forEach((seatState) => {
      const player = this.players.find((p) => p.id === seatState.playerId)
      if (!player) {
        this.insertPlayer(seatState)
      }
    })
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
          this.handleSync(message.globalState)
        }
      }
      if (IS_DEV) {
        console.log(m.string())
      }
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
    const ms = await this.consume(`seat_${this.boardId}`, seatKey)
    this.handleMessages(ms, true)
    this.seatKey = seatKey
    this.playButton.setVisible(false)
    this.sitButton.setVisible(true)
  }

  /**
   * Sends a request to sit at the game table.
   *
   * This function posts a request to the server to take a seat at the game table using
   * the current seat key.
   */
  async sit() {
    await request(getUrl('v1/game/sit'), {
      method: 'POST',
      payload: { seatKey: this.seatKey },
    })
    this.sitButton.setVisible(false)
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
    this.playButton = createButton({
      scene: this,
      x: width / 2,
      y: height - 500,
      width: 150,
      height: 75,
      label: 'Play',
      colors: ['#ad7111', '#d18c26', '#f7a73a'],
      onClick: this.play.bind(this),
    })

    // Sit Button
    this.sitButton = createButton({
      scene: this,
      x: width / 2,
      y: height - 500,
      width: 150,
      height: 75,
      label: 'Sit',
      colors: ['#ad7111', '#d18c26', '#f7a73a'],
      onClick: this.sit.bind(this),
    })

    this.enter()
  }

  update() {
    // Update position of custom cursor
    this.cursor.x = this.input.x
    this.cursor.y = this.input.y
  }
}

export default MainGame
