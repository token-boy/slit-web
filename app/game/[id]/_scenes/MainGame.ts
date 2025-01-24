/**
 * Design size: 3840x2160
 */

import { GameObjects, Scene } from 'phaser'
import { IS_DEV, SOL_DECIMALS } from '@/lib/constants'
import { signAndSendTx } from '@/hooks/use-sign-and-sign-tx'
import { jwtAuthenticator, wsconnect } from '@nats-io/nats-core'
import { ConsumerMessages, jetstream } from '@nats-io/jetstream'
import { getUrl, request } from '@/lib/request'
import {
  type Seat,
  type Message,
  GameCode,
  type Hands,
  uiAmount,
} from '@/lib/game'
import { cardNames, cardSounds } from '../cards'
import { EventBus } from '../EventBus'
import { toast } from '@/hooks/use-toast'

import Button from './Button'
import Player from './Player'
import { sleep } from '@/lib/utils'

class MainGame extends Scene {
  background: GameObjects.Image
  backgroundMusic: Phaser.Sound.WebAudioSound
  sounds: Phaser.Sound.WebAudioSound
  deck: GameObjects.Image[] = []
  cursor: GameObjects.Sprite
  playButton: Button
  potIcon: GameObjects.Image
  potText: GameObjects.Text
  players: Player[] = []
  myPlayer?: Player
  myHands: GameObjects.Image[] = []
  countdownIcon?: Phaser.GameObjects.Image
  countdownText?: Phaser.GameObjects.Text
  timer?: NodeJS.Timeout
  betButtonGroup: Button[] = []
  limit: bigint = BigInt(0)
  pot: bigint = BigInt(0)
  boardId: string
  seatKey: string
  playerId: string
  hands?: Hands
  balance: bigint = BigInt(0)

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
      servers: process.env.NEXT_PUBLIC_NATS_SERVER,
      authenticator: jwtAuthenticator(
        process.env.NEXT_PUBLIC_NATS_JWT_TOKEN!,
        new TextEncoder().encode(process.env.NEXT_PUBLIC_NATS_NKEY)
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
    request<{
      limit: string
    }>(getUrl(`v1/boards/${this.boardId}`), {
      method: 'GET',
    }).then(({ limit }) => {
      this.limit = BigInt(limit)
    })

    const { sessionId, seatKey, seat } = await request<{
      sessionId: string
      seatKey?: string
      seat?: Seat
    }>(getUrl(`v1/game/${this.boardId}/enter`), {
      method: 'GET',
    })

    if (!seatKey || !seat || seat.chips === '0') {
      this.playButton.setVisible(true)
    } else {
      this.seatKey = seatKey
      this.playerId = seat.playerId
    }

    const ms = await this.consume(`state_${this.boardId}`, sessionId)
    this.handleMessages(ms, false)
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
   * Inserts new player instances into the game scene based on the provided seats.
   *
   * Calculates the positions for the players and updates the position of existing
   * ones. For new players, creates `Player` instances and adds them to the scene,
   * excluding the current player's own seat.
   *
   * @param seats - An array of `Seat` objects representing the players to be added
   *                to the game scene.
   */
  private insertPlayers(seats: Seat[]) {
    const len = seats.length
    const positions = this.calcPlayerPositions(this.players.length + len)

    // Update existing players position
    for (let i = 0; i < positions.length - 2 * len; i += 2) {
      this.players[i / 2].setPosition(positions[i], positions[i + 1])
    }

    // Insert new players
    for (let i = 0; i < len; i++) {
      const seat = seats[i]
      const player = new Player({
        scene: this,
        x: positions[positions.length - 2 * (len - i)],
        y: positions[positions.length - 2 * (len - i) + 1],
        id: seat.playerId,
        width: 300,
        height: 100,
        chips: seat.chips,
        hands: seat.hands,
      })
      this.players.push(player)
    }
  }

  private async syncMySeat(seat: Seat) {
    const { width, height } = this.size()

    if (!this.myPlayer) {
      this.myPlayer = new Player({
        scene: this,
        x: width / 2 - 200,
        y: height - 100,
        id: seat.playerId,
        width: 300,
        height: 100,
        chips: seat.chips,
        hands: seat.hands,
      })
    } else {
      this.myPlayer.setState({ ...seat, hands: undefined })
    }

    // Get current hands
    this.balance = BigInt(seat.chips)
    if (seat.hands) {
      const { hands } = await request<{ hands?: Hands }>(
        getUrl(`v1/game/${this.boardId}/hands`),
        {
          method: 'POST',
          payload: {
            seatKey: this.seatKey,
          },
        }
      )
      if (hands) {
        hands.sort((a, b) => a - b)
        this.hands = hands
        this.setHands(hands)
      }
    } else {
      this.hands = undefined
      this.setHands(undefined)
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
  private async syncSeats(seats: Seat[]) {
    // Remove players that are no longer in the game
    this.players
      .filter((p) => !seats.find((s) => s.playerId === p.id))
      .forEach((p) => {
        p.destroy()
        this.players.splice(this.players.indexOf(p), 1)
      })

    // Insert new players
    this.insertPlayers(
      seats.filter(
        (seat) =>
          !this.players.find((p) => p.id === seat.playerId) &&
          seat.playerId !== this.playerId
      )
    )

    // Sync each players's state
    for (const seat of seats) {
      if (seat.playerId === this.playerId) {
        this.syncMySeat(seat)
      } else {
        const player = this.players.find((p) => p.id === seat.playerId)
        if (!player) {
          continue
        }
        player.setState(seat)
      }
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

    this.pot = BigInt(pot)
  }

  private clearCountdown() {
    if (this.countdownIcon && this.countdownText) {
      this.countdownIcon.destroy()
      this.countdownText.destroy()
      this.countdownIcon = undefined
      this.countdownText = undefined
      clearInterval(this.timer)
    }
  }

  private async createBetButtons() {
    const { width, height } = this.size()

    // If turn is my turn, hands may not be available yet
    let count = 0
    while (!this.hands && count++ < 5) {
      await sleep(1000)
    }
    if (!this.hands) {
      return
    }

    // Display bet buttons
    const actions: Dict<VoidFunction> = {}
    const hands = this.hands
      .map((n) => ((n - 1) % 13) + 1)
      .sort((a, b) => a - b)
    const diff = hands[1] - hands[0]
    console.log(diff, hands);
    
    if (diff > 1) {
      for (let i = 1; i < 4; i++) {
        actions[`${uiAmount(BigInt(i) * this.limit)} Chips`] = () => {
          this.bet(BigInt(i) * this.limit)
        }
      }
      actions[`Custom`] = () => {
        EventBus.emit('open-bet-input')
      }
      // A & K
      if (diff === 12 && this.balance >= this.pot) {
        actions['All In'] = () => {
          this.bet(BigInt(this.balance))
        }
      }
    }
    actions['Fold'] = () => {
      this.bet(0n)
    }
    const lables = Object.keys(actions)
    const baseX = width / 2 - (150 * lables.length) / 2
    for (let i = 0; i < lables.length; i++) {
      this.betButtonGroup.push(
        new Button({
          scene: this,
          x: baseX + 150 * i + 30 * i,
          y: height - 300,
          width: 150,
          height: 75,
          label: lables[i],
          colors: ['#ad7111', '#d18c26', '#f7a73a'],
          onClick: actions[lables[i]].bind(this),
        })
      )
    }
  }

  private removeBetButtons() {
    this.betButtonGroup.forEach((b) => b.destroy())
    this.betButtonGroup = []
  }

  private setCountdown(expireAt: number) {
    const { width, height } = this.size()

    const countdownIcon = this.add
      .image(width / 2 + 300, height - 100, 'countdown')
      .setDisplaySize(48, 48)
    const countdownText = this.add
      .text(
        countdownIcon.x,
        countdownIcon.y,
        `${Math.floor((expireAt - Date.now()) / 1000)}`,
        {
          fontSize: 24,
          color: 'white',
        }
      )
      .setOrigin(0.5)
    this.countdownIcon = countdownIcon
    this.countdownText = countdownText

    this.timer = setInterval(() => {
      const now = Date.now()
      if (expireAt < now) {
        this.clearCountdown()
        return
      }
      countdownText.setText(`${Math.floor((expireAt - now) / 1000)}`)
    }, 1000)
  }

  /**
   * Updates the visual representation of the current turn in the game.
   *
   * For the player with the matching ID, sets the countdown display to the
   * provided value. For all other players, clears the countdown display.
   *
   * @param playerId - The ID of the player whose turn is to be updated.
   * @param expireAt - The new value of the turn, as a number representing the
   *                   Unix timestamp in milliseconds when the turn expires.
   */
  private syncTurn(playerId?: string, expireAt?: number) {
    if (!playerId) {
      return
    }
    if (this.playerId === playerId) {
      this.setCountdown(expireAt!)
      this.createBetButtons()
    } else if (this.countdownIcon) {
      this.clearCountdown()
      this.removeBetButtons()
    }
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
   * Sets the visual representation of the player's hands.
   *
   * Calculates the positions for the hands and updates the position of existing
   * ones. For new hands, creates `Phaser.GameObjects.Image` instances and adds
   * them to the scene.
   *
   * @param hands - The new value of the hands, as a pair of numbers.
   */
  private setHands(hands?: Hands) {
    const myHands = this.myHands
    if (hands) {
      hands = hands.sort((a, b) => ((a - 1) % 13) + 1 - ((b - 1) % 13) + 1)
      myHands[0].setTexture(cardNames[hands[0]])
      myHands[1].setTexture(cardNames[hands[1]])
      myHands[0].setVisible(true)
      myHands[1].setVisible(true)
    } else {
      myHands[0].setVisible(false)
      myHands[1].setVisible(false)
    }
  }

  private async bet(chips: bigint) {
    if (!this.myPlayer || chips > this.balance) {
      toast({ title: 'Chips not enough' })
      return
    }

    this.removeBetButtons()
    await request(getUrl(`v1/game/${this.boardId}/bet`), {
      method: 'POST',
      payload: {
        seatKey: this.seatKey,
        bet: chips.toString(),
      },
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
        await m.ackAck()
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
    this.seatKey = seatKey
    this.playerId = playerId
    this.playButton.setVisible(false)
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
    this.playButton = new Button({
      scene: this,
      x: width / 2,
      y: height - 500,
      width: 150,
      height: 75,
      label: 'Play',
      colors: ['#ad7111', '#d18c26', '#f7a73a'],
      onClick: this.stake.bind(this),
    })
    this.playButton.setVisible(false)

    // Create my hands
    const hand0 = this.add.image(width / 2 + 100, height - 100, cardNames[0])
    const hand1 = this.add.image(hand0.x + 30, hand0.y, cardNames[0])
    hand0.setVisible(false)
    hand1.setVisible(false)
    this.myHands.push(hand0, hand1)

    EventBus.on('bet-input-submited', this.bet.bind(this))

    this.enter()
  }

  update() {
    // Update position of custom cursor
    this.cursor.x = this.input.x
    this.cursor.y = this.input.y
  }
}

export default MainGame
