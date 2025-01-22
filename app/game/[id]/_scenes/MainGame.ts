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
import { Seat, SeatState, Message, GameCode, Hands } from '@/lib/game'
import { cardNames, cardSounds } from '../cards'

class MainGame extends Scene {
  background: GameObjects.Image
  backgroundMusic: Phaser.Sound.WebAudioSound
  sounds: Phaser.Sound.WebAudioSound
  deck: GameObjects.Image[] = []
  cursor: GameObjects.Sprite
  playButton: GameObjects.Container
  sitButton: GameObjects.Container
  potIcon: GameObjects.Image
  potText: GameObjects.Text
  players: Player[] = []
  boardId: string
  seatKey: string
  playerId: string

  constructor() {
    super('MainGame')
    this.boardId = location.pathname.split('/')[2]
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
      servers: 'ws://localhost:4223',
      authenticator: jwtAuthenticator(
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJlZDI1NTE5LW5rZXkifQ.eyJqdGkiOiJVS0dKVVgyWDZCWUxYRUhEVlZDWkRWS1BNQjZFSzVQVFdXS1BPQ1lPWUNQREw3U1hMSlJRIiwiaWF0IjoxNzM3MDg3ODgwLCJpc3MiOiJBQ1AzVjdMN1VMRkpKTkFHNjZTNlIyUkxWTUM3TkVPM1VNQklJSUdBUEFPVTVTV1c3V01CWTJNVSIsIm5hbWUiOiJwbGF5ZXIiLCJzdWIiOiJVQ0FTT1lMS1hDMlJQUFFKRzdES1lITjNWSkxUVE5LWEZURkFHSkROSU03MkpZN0tZVzdPTURNUSIsIm5hdHMiOnsicHViIjp7ImFsbG93IjpbIiRKUy5BQ0suZ2FtZS5cdTAwM2UiLCIkSlMuQVBJLkNPTlNVTUVSLklORk8uXHUwMDNlIiwiJEpTLkFQSS5DT05TVU1FUi5NU0cuTkVYVC5cdTAwM2UiXX0sInN1YiI6e30sInN1YnMiOi0xLCJkYXRhIjotMSwicGF5bG9hZCI6LTEsInR5cGUiOiJ1c2VyIiwidmVyc2lvbiI6Mn19.vtS1-sxmA8M4OrNh1sVvU1XS3OEX7m0kArIhK2RqdNWcWXx5HPscm3pFxLy8IUtSuEFVtSaiKnkdYcs9O4MaCA',
        new TextEncoder().encode(
          'SUAFKNKRDJZ5AV6QQAMK2NORP2BAFKQDCMF6GQQ2SA6PLAJ6BYKECO4LIQ'
        )
      ),
    })

    const js = jetstream(nc)
    const c = await js.consumers.get(stream, name)
    return c.consume()
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
    const { sessionId, seatKey, seat } = await request<{
      sessionId: string
      seatKey?: string
      seat?: Seat
    }>(getUrl(`v1/game/${this.boardId}/enter`), {
      method: 'GET',
    })

    const ms = await this.consume(`state_${this.boardId}`, sessionId)
    this.handleMessages(ms, false)

    if (seatKey && seat) {
      this.playerId = seat.playerId
      if (seat.status === 'unready') {
        this.playButton.setVisible(true)
      } else if (seat.status === 'ready') {
        this.seatKey = seatKey
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
  private calcPlayerPositions(len: number) {
    const { width, height } = this.size.call(this)

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

  /**
   * Updates the visual representation of the players based on the provided states.
   *
   * Any players in the provided states that are not currently in the scene are added.
   * The players are positioned based on their index in the provided states array.
   *
   * @param states - The states of the players to add to the scene.
   */
  private insertPlayers(seatStates: SeatState[]) {
    const len = seatStates.length
    const positions = this.calcPlayerPositions(this.players.length + len)

    // Update existing players position
    for (let i = 0; i < positions.length - 2 * len; i += 2) {
      this.players[i / 2].setPosition(positions[i], positions[i + 1])
    }

    // Insert new players
    for (let i = 0; i < len; i++) {
      const seatState = seatStates[i]
      const isMine = this.playerId === seatState.playerId
      const { width, height } = this.size()

      const player = new Player({
        scene: this,
        x: isMine ? width / 2 : positions[positions.length - 2 * (len - i)],
        y: isMine
          ? height - 200
          : positions[positions.length - 2 * (len - i) + 1],
        id: seatState.playerId,
        width: 300,
        height: 100,
        chips: seatState.chips,
        hands: seatState.hands,
      })
      this.players.push(player)
    }
  }

  /**
   * Updates the visual representation of the players based on the provided states.
   *
   * Any players in the provided states that are not currently in the scene are added.
   * The players are positioned based on their index in the provided states array.
   *
   * @param states - The states of the players to add to the scene.
   */
  private async syncSeats(states: SeatState[]) {
    // Remove players that are no longer in the game
    this.players
      .filter((p) => !states.find((s) => s.playerId === p.id))
      .forEach((p) => {
        p.destroy()
        this.players.splice(this.players.indexOf(p), 1)
      })

    // Insert new players
    this.insertPlayers(
      states.filter(
        (states) => !this.players.find((p) => p.id === states.playerId)
      )
    )

    for (const state of states) {
      const player = this.players.find((p) => p.id === state.playerId)
      if (!player) {
        continue
      }
      player.setState(state)
    }
  }

  /**
   * Synchronizes the visual representation of the deck with the current game state.
   *
   * Adjusts the number of cards displayed to match the specified count. If there are
   * more cards than needed, excess cards are removed. If there are fewer cards, new
   * cards are added and positioned accordingly.
   *
   * @param count - The target number of cards to display in the deck.
   * @param pot - The current pot value, which may be used for display purposes.
   */
  private syncDeck(count: number) {
    const diffLen = this.deck.length - count
    if (diffLen > 0) {
      // Remove extra cards
      this.deck.splice(-diffLen).forEach((card) => card.destroy())
    } else if (diffLen < 0) {
      const { width, height } = this.size()

      // Add missing cards
      // const cardWidth = 300
      const cardHeight = 420
      const gap = 20
      let deckX = width / 2 + (gap * 51) / 2
      if (this.deck.length > 0) {
        deckX = this.deck[this.deck.length - 1].x
      }
      const deckY = height / 2 - cardHeight

      for (let i = 0; i < Math.abs(diffLen); i++) {
        this.deck.push(this.add.image(deckX - gap * i, deckY, 'Deck'))
      }
    }
  }

  /**
   * Updates the visual representation of the pot in the game.
   *
   * Initializes the pot icon and text display if they do not exist.
   * Sets the text to the current pot value, adjusting for decimals.
   *
   * @param pot - The current pot value as a string, used to update the display.
   */

  private syncPot(pot: string) {
    const iconSize = 150

    if (!this.potText) {
      const { width, height } = this.size()
      this.potIcon = this.add
        .image(width / 2 - iconSize / 2, height / 2, 'pot')
        .setDisplaySize(iconSize, iconSize)
      this.potText = this.add.text(width / 2 + 36, height / 2, '0', {
        fontSize: 36,
        color: '#22AB74',
      })
    } else {
      this.potText.setText((BigInt(pot) / SOL_DECIMALS).toString())
    }
  }

  /**
   * Synchronizes the turn indicator for players in the game.
   *
   * Sets the countdown timer for the player whose turn it currently is,
   * based on the provided playerId and the expiration time. Clears the
   * countdown for all other players.
   *
   * @param playerId - The ID of the player whose turn it is. If undefined,
   *                   no player's countdown will be set.
   * @param expireAt - The timestamp at which the turn expires. If undefined,
   *                   the countdown will not be set for the player.
   */

  private syncTurn(playerId?: string, expireAt?: number) {
    for (const player of this.players) {
      if (player.id === playerId) {
        player.setCountdown(expireAt!)
      } else {
        player.clearCountdown()
      }
    }
  }

  /**
   * Updates the visual representation of the current bet in the game.
   *
   * For the player with the matching ID, sets the bet display to the provided
   * value and hands. For all other players, clears the bet display.
   *
   * @param playerId - The ID of the player whose bet is to be updated.
   * @param bet - The new value of the bet, as a string.
   * @param hands - The new value of the hands, as a pair of strings.
   */
  private syncBet(playerId: string, bet: string, hands: Hands) {
    for (const player of this.players) {
      if (player.id === playerId) {
        player.setBet(bet, hands)
        const sounds = this.sounds
        if (BigInt(bet) === 0n) {
          sounds.play(['不要', '过'].at(Math.floor(Math.random() * 2)))
        } else {
          sounds.play(
            ['这牌不错', '碰碰运气'].at(Math.floor(Math.random() * 2))
          )
        }
      } else {
        player.clearBet()
      }
    }
  }

  /**
   * Updates the visual representation of the open card in the deck.
   *
   * Sets the texture of the first card in the deck to match the provided
   * card index, updating its appearance to reflect the current game state.
   *
   * @param card - The index of the card to display, used to update the texture.
   */
  private syncOpen(card: number) {
    const targetCard = this.deck[this.deck.length - 1]
    if (!targetCard) {
      return
    }
    targetCard.setTexture(cardNames[card])
    setTimeout(() => {
      this.sounds.play(cardSounds.chinese[card], { delay: 1.5 })
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
          this.syncDeck(message.deckCount)
          this.syncPot(message.pot)
          this.syncSeats(message.seats)
          this.syncTurn(message.turn, message.turnExpireAt)
          break
        }
        case GameCode.Bet: {
          this.syncBet(message.playerId, message.bet, message.hands)
          break
        }
        case GameCode.Open: {
          this.syncOpen(message.card)
          break
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
  async stake() {
    const { tx, seatKey, playerId } = await request(
      getUrl('v1/game/:boardId/stake', { boardId: this.boardId }),
      {
        method: 'POST',
        payload: {
          chips: (100n * SOL_DECIMALS).toString(),
        },
      }
    )
    await signAndSendTx(tx)
    const ms = await this.consume(`seat_${this.boardId}`, seatKey)
    this.handleMessages(ms, true)
    this.seatKey = seatKey
    this.playerId = playerId
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

    this.backgroundMusic = this.sound.add('background-music', {
      loop: true,
      volume: 1,
    }) as Phaser.Sound.WebAudioSound
    this.backgroundMusic.play()

    this.sounds = this.sound.addAudioSprite(
      'sounds-chinese'
    ) as Phaser.Sound.WebAudioSound

    // Custom cursor
    this.cursor = this.add
      .sprite(100, 100, 'cursor')
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
      onClick: this.stake.bind(this),
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
