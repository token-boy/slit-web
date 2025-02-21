/**
 * Design size: 3840x2160
 */

import { GameObjects, Scene } from 'phaser'
import { jwtAuthenticator, wsconnect } from '@nats-io/nats-core'
import { ConsumerMessages, jetstream } from '@nats-io/jetstream'

import { IS_DEV, SOL_DECIMALS } from '@/lib/constants'
import { signAndSendTx } from '@/hooks/use-sign-and-sign-tx'
import { getUrl, request } from '@/lib/request'
import {
  type Seat,
  type Message,
  GameCode,
  type Hands,
  uiAmount,
} from '@/lib/game'
import { getStorage, isMobileDevice, sleep } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

import { cardHeight, cardNames, cardSounds } from './cards'
import { EventBus } from './EventBus'
import Button from './Button'
import Player from './Player'
import Control from './Control'
import { getSize } from './utils'

class MainGame extends Scene {
  container: GameObjects.Container
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
  timer?: Phaser.Time.TimerEvent
  betButtonGroup: Button[] = []
  limit: bigint = BigInt(0)
  pot: bigint = BigInt(0)
  boardId: string
  seatKey?: string
  playerId?: string
  hands?: Hands
  balance: bigint = BigInt(0)
  mute: boolean = false

  constructor() {
    super('MainGame')
    this.boardId = location.pathname.split('/')[2]
    this.mute = getStorage().getItem('mute') === '1'
  }

  size() {
    return getSize(this)
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
    const { sessionId, seatKey, seat, board } = await request<{
      sessionId: string
      seatKey?: string
      seat?: Seat
      board: {
        limit: string
      }
    }>(getUrl(`v1/game/${this.boardId}/enter`), {
      method: 'GET',
    })
    this.limit = BigInt(board.limit)

    if (seatKey && seat) {
      this.seatKey = seatKey
      this.playerId = seat.playerId
      this.syncMySeat(seat)

      const { width, height } = this.size()

      // Stake
      new Control({
        container: this.container,
        x: width - 150,
        y: height - 100,
        icon: 'stake',
        tips: 'Stake',
        onClick: () => {
          EventBus.emit('open-stake-input')
        },
      })

      // Exit
      new Control({
        container: this.container,
        x: width - 60,
        y: height - 100,
        icon: 'exit',
        tips: 'Exit',
        onClick: () => {
          EventBus.emit('open-exit-confirm')
        },
      })
    } else {
      this.playButton.setVisible(true)
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
      return [width - gap, height / 2, gap, height / 2]
    } else if (len === 3) {
      return [width - gap, height / 2, width / 2, gap / 2, gap, height / 2]
    } else if (len === 4) {
      return [
        width - gap,
        height / 2,
        width - width / 3,
        gap / 2,
        width / 3,
        gap / 2,
        gap,
        height / 2,
      ]
    } else if (len === 5) {
      return [
        width - gap,
        height / 2,
        width - width / 4,
        gap / 2,
        width / 2,
        gap / 2,
        width / 4,
        gap / 2,
        gap,
        height / 2,
      ]
    } else if (len === 6) {
      return [
        width - gap,
        height / 2,
        width - width / 3,
        gap / 2,
        width / 3,
        gap / 2,
        gap,
        height / 2,
        width / 4,
        height - height / 4,
        width - width / 4,
        height - height / 4,
      ]
    } else if (len === 7) {
      return [
        width - gap,
        height / 2,
        width - width / 4,
        gap / 2,
        width / 2,
        gap / 2,
        width / 4,
        gap / 2,
        gap,
        height / 2,
        width / 4,
        height - height / 4,
        width - width / 4,
        height - height / 4,
      ]
    } else if (len === 8) {
      return [
        width - gap,
        height / 2,
        width - width / 6,
        height / 4,
        width - width / 3,
        gap / 2,
        width / 3,
        gap / 2,
        width / 6,
        height / 4,
        gap,
        height / 2,
        width / 4,
        height - height / 4,
        width - width / 4,
        height - height / 4,
      ]
    } else if (len === 9) {
      return [
        width - gap,
        height / 2,
        width - width / 6,
        height / 4,
        width - width / 3,
        gap / 2,
        width / 2,
        gap / 2,
        width / 3,
        gap / 2,
        width / 6,
        height / 4,
        gap,
        height / 2,
        width / 4,
        height - height / 4,
        width - width / 4,
        height - height / 4,
      ]
    } else if (len === 10) {
      return [
        width - gap,
        height / 2,
        width - width / 6,
        height / 4,
        width - width / 3,
        gap / 2,
        width / 2,
        gap / 2,
        width / 3,
        gap / 2,
        width / 6,
        height / 4,
        gap,
        height / 2,
        width / 4,
        height - height / 4,
        width / 2,
        height - gap,
        width - width / 4,
        height - height / 4,
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
  private insertPlayers(seats: Seat[], myIndex: number) {
    if (this.players.length) {
      return
    }
    const len = seats.length
    const positions = this.calcPlayerPositions(this.players.length + len)
    if (myIndex !== -1) {
      positions.push(...positions.splice(0, positions.length - myIndex * 2))
    }

    // Update existing players position
    for (let i = 0; i < positions.length - 2 * len; i += 2) {
      this.players[i / 2].setPosition(positions[i], positions[i + 1])
    }

    // Insert new players
    for (let i = 0; i < len; i++) {
      const seat = seats[i]
      const player = new Player({
        container: this.container,
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

  /**
   * Synchronizes the current player's seat information.
   *
   * If the player instance does not exist, it creates a new `Player` and sets its
   * position and properties based on the provided `seat` data. If the player
   * instance already exists, it updates the player's state with the new seat data,
   * excluding the hands.
   *
   * Retrieves the current hands for the player from the server if available,
   * sorts them, and updates the player's hand display.
   *
   * @param seat - The `Seat` object containing the player's seat information,
   *               including player ID, chips, and hands.
   */
  private async syncMySeat(seat: Seat) {
    const { width, height } = this.size()

    if (!this.myPlayer) {
      this.myPlayer = new Player({
        container: this.container,
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
    const myIndex = seats.findIndex((seat) => seat.playerId === this.playerId)
    this.insertPlayers(
      seats.filter(
        (seat) =>
          !this.players.find((p) => p.id === seat.playerId) &&
          seat.playerId !== this.playerId
      ),
      myIndex
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

    // Sync my player exit state
    if (myIndex === -1 && this.myPlayer) {
      this.setHands()
      this.playButton.setVisible(true)
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
      const gap = 20
      let deckX = width / 2 + (gap * 51) / 2
      if (this.deck.length > 0) {
        deckX = this.deck[this.deck.length - 1].x
      }
      const deckY = height / 2 - cardHeight * this.size().scale

      for (let i = 0; i < Math.abs(diffLen); i++) {
        const image = this.make.image({
          x: deckX - gap * i,
          y: deckY,
          key: 'Deck',
        })
        this.container.add(image)
        this.deck.push(image)
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
  private syncPot(pot?: string) {
    const iconSize = 150

    if (!this.potText) {
      const { width, height } = this.size()
      this.potIcon = this.make
        .image({
          x: width / 2 - iconSize / 2,
          y: height / 2,
          key: 'pot',
        })
        .setDisplaySize(iconSize, iconSize)
      this.potText = this.make.text({
        x: width / 2 + 36,
        y: height / 2,
        text: '0',
        style: {
          fontSize: 36,
          color: '#22AB74',
        },
      })
      this.container.add([this.potIcon, this.potText])
    } else {
      this.potText.setText((BigInt(pot ?? '0') / SOL_DECIMALS).toString())
    }

    this.pot = BigInt(pot ?? '0')
  }

  /**
   * Clears the countdown display and associated timer.
   *
   * Destroys the countdown icon and text if they exist, and sets the
   * countdown icon and text properties to undefined. Additionally, it
   * destroys the countdown timer if it exists and sets the timer property
   * to undefined, effectively stopping any active countdown.
   */
  private clearCountdown() {
    if (this.countdownIcon && this.countdownText) {
      this.countdownIcon.destroy()
      this.countdownText.destroy()
      this.countdownIcon = undefined
      this.countdownText = undefined
      this.timer?.destroy()
      this.timer = undefined
    }
  }

  /**
   * Creates and displays the betting buttons for the player.
   *
   * If the player is currently in their turn, and the hands have not been
   * received after 5 seconds, the function will exit without displaying the
   * buttons.
   *
   * The buttons are displayed horizontally, with the option to bet 1 chip, 2
   * chips, 3 chips, a custom amount, or to fold. The custom amount button
   * will open up the custom bet input modal.
   *
   * If the player has enough balance to go all in, an "All In" button will
   * also be displayed.
   *
   * The buttons are centered horizontally on the screen, at a y-coordinate of
   * 300px from the top of the screen.
   */
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
          container: this.container,
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

  /**
   * Destroys all the bet buttons and clears the array.
   *
   * Called whenever the game state changes, such as when the player's turn ends,
   * or when a new round starts.
   */
  private removeBetButtons() {
    this.betButtonGroup.forEach((b) => b.destroy())
    this.betButtonGroup = []
  }

  /**
   * Initializes a countdown timer that displays on the screen.
   *
   * @param expireAt - The timestamp when the countdown should end.
   *
   * The method creates a countdown icon and text to display the remaining
   * time in seconds until the specified `expireAt` timestamp. If a countdown
   * is already active, the method exits early. Once initialized, the countdown
   * updates every second. When the countdown reaches zero, it triggers the
   * `clearCountdown` method to remove the countdown display.
   */
  private setCountdown(expireAt: number) {
    const { width, height } = this.size()

    if (this.timer) {
      return
    }

    const countdownIcon = this.make
      .image({
        x: width / 2 + 300,
        y: height - 100,
        key: 'countdown',
      })
      .setDisplaySize(48, 48)
    const countdownText = this.make
      .text({
        x: countdownIcon.x,
        y: countdownIcon.y,
        text: `${Math.floor((expireAt - Date.now()) / 1000)}`,
        style: {
          fontSize: 24,
          color: 'white',
        },
      })
      .setOrigin(0.5)
    this.countdownIcon = countdownIcon
    this.countdownText = countdownText
    this.container.add([countdownIcon, countdownText])

    this.timer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        const now = Date.now()
        if (expireAt < now) {
          this.clearCountdown()
          return
        }
        countdownText.setText(`${Math.floor((expireAt - now) / 1000)}`)
      },
    })
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
    } else if (this.timer || this.betButtonGroup.length) {
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
        if (!this.mute) {
          const sounds = this.sounds
          if (BigInt(bet) === 0n) {
            sounds.play(['不要', '过'].at(Math.floor(Math.random() * 2)))
          } else {
            sounds.play(
              ['这牌不错', '碰碰运气'].at(Math.floor(Math.random() * 2))
            )
          }
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
    if (!this.mute) {
      setTimeout(() => {
        this.sounds.play(cardSounds.chinese[card], { delay: 1.5 })
      })
    }
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

  /**
   * Places a bet by sending a request to the server with the specified amount of chips.
   *
   * If the player does not have enough chips, displays a toast message and exits early.
   * Removes the bet buttons before sending the request and restores them if the request fails.
   *
   * @param chips - The amount of chips to bet.
   */
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
    }).catch(() => {
      this.createBetButtons()
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
  async stake(chips: bigint) {
    const { tx, seatKey, playerId } = await request(
      getUrl('v1/game/:boardId/stake', { boardId: this.boardId }),
      {
        method: 'POST',
        payload: {
          chips: chips.toString(),
          seatKey: this.seatKey,
        },
      }
    )
    this.seatKey = seatKey
    this.playerId = playerId
    this.playButton.setVisible(false)
    await signAndSendTx(tx)
  }

  /**
   * Redeems the current player's seat in the game.
   *
   * This method sends a POST request to the server to redeem the player's seat using the `seatKey`.
   * Upon successful redemption, it signs and sends the transaction, then resets the player's seat and ID.
   * It also makes the play button visible, clears any countdowns, and removes bet buttons.
   */
  private async redeem() {
    const { tx } = await request(
      getUrl('v1/game/:boardId/redeem', { boardId: this.boardId }),
      {
        method: 'POST',
        payload: {
          seatKey: this.seatKey,
        },
      }
    )
    this.seatKey = undefined
    this.myPlayer?.destroy()
    this.myPlayer = undefined
    this.setHands()
    this.clearCountdown()
    this.removeBetButtons()
    this.playButton.setVisible(true)
    await signAndSendTx(tx)
  }

  /**
   * The create method is called after the scene has been initialized.
   * It is used to create all the game objects and add them to the scene.
   * It is also used to set up the game's audio and input.
   *
   * It creates a container for the game and adds the game's background,
   * my hands, play button, and back control to it.
   * It also sets up the game's audio and input.
   *
   * It emits the 'open-stake-input' event when the play button is clicked.
   * It emits the 'bet-input-submited' event when the bet input is submitted.
   * It emits the 'stake-input-submited' event when the stake input is submitted.
   * It emits the 'exit-confirmed' event when the exit button is clicked.
   *
   * It is also used to set up the game's start animation.
   */
  create() {
    const { width, height, scale } = this.size()
    this.data.set('width', width)
    this.data.set('height', height)

    const container = this.make
      .container({})
      .setSize(width, height)
      .setDisplaySize(width, height)
    if (isMobileDevice()) {
      container.setPosition(height, 0)
      container.setRotation(Math.PI / 2)
    }
    this.container = container

    // Game background
    const background = this.make
      .image({ x: 0, y: 0, key: 'background' })
      .setOrigin(0)
      .setDisplaySize(width, height)
    container.add(background)

    // Game audio
    this.backgroundMusic = this.sound.add('background-music', {
      loop: true,
      volume: 1,
    }) as Phaser.Sound.WebAudioSound
    this.sounds = this.sound.addAudioSprite(
      'sounds-chinese'
    ) as Phaser.Sound.WebAudioSound
    if (!this.mute) {
      this.backgroundMusic.play()
    }

    // Create my hands
    const hand0 = this.make
      .image({
        x: width / 2 + 100,
        y: height - 100,
        key: cardNames[0],
      })
      .setVisible(false)
    const hand1 = this.make
      .image({
        x: hand0.x + 30,
        y: hand0.y,
        key: cardNames[0],
      })
      .setVisible(false)
    this.myHands.push(hand0, hand1)
    this.container.add([hand0, hand1])

    // Play Button
    this.playButton = new Button({
      container,
      x: width / 2,
      y: height - 360,
      width: 150,
      height: 75,
      label: 'Play',
      colors: ['#ad7111', '#d18c26', '#f7a73a'],
      onClick: () => {
        const accessToken = getStorage().getItem('accessToken')
        if (
          !accessToken ||
          JSON.parse(atob(accessToken.split('.')[1])).exp < Date.now()
        ) {
          EventBus.emit('open-wallet-connector')
          return
        }
        EventBus.emit('open-stake-input')
      },
    })
    this.playButton.setVisible(false)

    // Back
    new Control({
      container,
      x: 50,
      y: 50,
      icon: 'back',
      onClick: () => {
        window.location.href = '/play'
      },
    })

    // Mute
    const muteControl = new Control({
      container,
      x: width - 100,
      y: 100,
      icon: this.mute ? 'mute' : 'unmute',
      onClick: () => {
        if (this.mute) {
          this.backgroundMusic.play()
          muteControl.setIcon('unmute')
          getStorage().setItem('mute', '0')
        } else {
          this.backgroundMusic.pause()
          muteControl.setIcon('mute')
          getStorage().setItem('mute', '1')
        }
        this.mute = !this.mute
      },
    })

    EventBus.on('bet-input-submited', this.bet.bind(this))
    EventBus.on('stake-input-submited', this.stake.bind(this))
    EventBus.on('exit-confirmed', this.redeem.bind(this))

    // Start
    const startTexture = this.textures.get('start')
    const startImage = startTexture.getSourceImage()
    startTexture.add('left', 0, 0, 0, startImage.width / 2, startImage.height)
    startTexture.add(
      'right',
      0,
      startImage.width / 2,
      0,
      startImage.width / 2,
      startImage.height
    )
    const startLeft = this.make
      .sprite({
        x: width / 4,
        y: height / 2,
        key: 'start',
        frame: 'left',
      })
      .setScale(scale)
    const startRight = this.make
      .sprite({
        x: width - width / 4,
        y: height / 2,
        key: 'start',
        frame: 'right',
      })
      .setScale(scale)
    container.add([startLeft, startRight])
    this.tweens.add({
      targets: startLeft,
      x: width / 2 - (startLeft.width * scale) / 2,
      duration: 500,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => {
        if (!this.mute) {
          this.sound.add('start', { volume: 1 }).play()
        }
        setTimeout(() => {
          container.remove(startLeft)
          startLeft.destroy()
        }, 1000)
      },
    })
    this.tweens.add({
      targets: startRight,
      x: width / 2 + (startRight.width * scale) / 2,
      duration: 500,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => {
        setTimeout(() => {
          container.remove(startRight)
          startRight.destroy()
        }, 1000)
      },
    })

    this.enter()
  }
}

export default MainGame
