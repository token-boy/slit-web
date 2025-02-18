import { CDN_URL, SOL_DECIMALS } from '@/lib/constants'
import { Hands, Seat } from '@/lib/game'
import { getUrl, request } from '@/lib/request'
import { cardNames } from '../cards'
import { drawRoundedCorner } from './Button'

interface PlayerOptions {
  container: Phaser.GameObjects.Container
  x: number
  y: number
  width: number
  height: number
  id: string
  chips: string
  hands?: Hands
}

class Player {
  private options: PlayerOptions
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private isOnLeft: boolean
  private avatar?: Phaser.GameObjects.Image
  private nickname?: Phaser.GameObjects.Text
  private myChipsIcon: Phaser.GameObjects.Image
  private myChipsText: Phaser.GameObjects.Text
  private myHands: Phaser.GameObjects.Image[] = []
  private countdownIcon?: Phaser.GameObjects.Image
  private countdownText?: Phaser.GameObjects.Text
  private timer?: Phaser.Time.TimerEvent
  private betIcon?: Phaser.GameObjects.Image
  private betText?: Phaser.GameObjects.Text
  id: string

  constructor(options: PlayerOptions) {
    this.options = options

    const { container: parent, x, y, width, height } = options
    const scene = (this.scene = parent.scene)
    this.id = options.id

    const container = scene.add.container(x, y)
    container.setSize(width, height)

    this.updateIsOnLeft()

    // Load player profile
    request(getUrl(`v1/players/${options.id}`)).then((profile) => {
      const avatarUrl = `${CDN_URL}/${profile.avatarUrl}`

      // Create avatar
      scene.load.image(avatarUrl, avatarUrl).once('complete', () => {
        const sourceImage = scene.textures.get(avatarUrl).getSourceImage()
        const canvas = scene.textures.createCanvas(
          crypto.randomUUID(),
          sourceImage.width,
          sourceImage.height
        )!
        const ctx = canvas.getContext()
        drawRoundedCorner(canvas, sourceImage.width / 2)
        ctx.drawImage(sourceImage as HTMLImageElement, 0, 0)

        const image = scene.make.image({ key: canvas })
        this.avatar = image
        this.updateAvatarPosition()

        container.add(image)
      })
      scene.load.start()

      // Create nickname
      const nickname = scene.make.text({
        text: profile.nickname,
        style: { fontSize: 24 },
      })
      this.nickname = nickname
      this.updateNicknamePosition()
      container.add(nickname)
    })

    // Create my chips
    const icon = scene.make.image({ key: 'my-chips' })
    const text = scene.make.text({
      text: (BigInt(options.chips) / SOL_DECIMALS).toString(),
      style: { fontSize: 24 },
    })
    this.myChipsIcon = icon
    this.myChipsText = text
    this.updateMyChipsPosition()
    container.add([icon, text])

    // Create hands
    const hand0 = scene.add.image(0, 0, 'Deck')
    const hand1 = scene.add.image(0, 0, 'Deck')
    hand0.setVisible(false)
    hand1.setVisible(false)
    this.myHands.push(hand0, hand1)
    this.updateMyHandsPosition()
    container.add([hand0, hand1])

    this.container = container
    parent.add(container)
  }

  /**
   * Make object on the right side of the screen appear correctly.
   */
  private updateIsOnLeft() {
    const { x, width } = this.options
    const canvasWidth = this.scene.game.config.width as number
    this.isOnLeft = x < canvasWidth / 2 + width
  }

  private updateAvatarPosition() {
    if (!this.avatar) {
      return
    }

    const { width, height } = this.options
    const size = width / 3
    this.avatar
      .setPosition(this.isOnLeft ? -width / 2 : width / 2, -height / 2)
      .setOrigin(this.isOnLeft ? 0 : 1, 0)
      .setDisplaySize(size, size)
  }

  private updateNicknamePosition() {
    if (!this.nickname) {
      return
    }

    const { width, height } = this.options

    const positionX = -width / 2 + width / 3 + 10
    this.nickname
      .setPosition(this.isOnLeft ? positionX : -positionX, -height / 2 + 12)
      .setOrigin(this.isOnLeft ? 0 : 1, 0)
  }

  private updateMyChipsPosition() {
    const { width, height } = this.options
    const size = width / 6

    const positionX = -width / 2 + width / 3 + 10
    const positionY = -height / 2 + 50
    this.myChipsIcon
      .setPosition(this.isOnLeft ? positionX : -positionX, positionY)
      .setOrigin(this.isOnLeft ? 0 : 1, 0)
      .setDisplaySize(size, size)
    this.myChipsText
      .setPosition(
        this.isOnLeft ? positionX + size + 10 : -positionX - size - 10,
        positionY + size / 2
      )
      .setOrigin(this.isOnLeft ? 0 : 1, 0.5)
  }

  private updateMyHandsPosition() {
    const { width } = this.options
    const cardWidth = 60
    const cardHeight = 84

    const positionX = -width / 2 + width / 3 / 2 - (cardWidth + 10) / 2
    const originX = this.isOnLeft ? 0 : 1
    const leftCard = this.myHands[this.isOnLeft ? 0 : 1]
    const rightCard = this.myHands[this.isOnLeft ? 1 : 0]

    leftCard
      .setPosition(this.isOnLeft ? positionX : -positionX, width / 3 / 2 + 10)
      .setOrigin(originX, 0)
      .setDisplaySize(cardWidth, cardHeight)
    rightCard
      .setPosition(leftCard.x + (this.isOnLeft ? 10 : -10), leftCard.y)
      .setOrigin(originX, 0)
      .setDisplaySize(cardWidth, cardHeight)
  }

  private updateCountdownPosition() {
    if (this.countdownIcon && this.countdownText) {
      const { width } = this.options
      this.countdownIcon
        .setPosition(0, width / 3 / 2 + 36)
        .setDisplaySize(48, 48)
      this.countdownText
        .setPosition(this.countdownIcon.x, this.countdownIcon.y)
        .setOrigin(0.5)
    }
  }

  private updateBetPosition() {
    if (this.betIcon && this.betText) {
      const { width } = this.options
      this.betIcon.setPosition(0, width / 3 / 2 + 36).setDisplaySize(48, 48)
      this.betText.setPosition(this.betIcon.x, this.betIcon.y).setOrigin(0.5)
    }
  }

  private setMyHands(hands?: Hands) {
    const myHands = this.myHands
    if (hands) {
      myHands[0].setTexture(cardNames[hands[0]])
      myHands[1].setTexture(cardNames[hands[1]])
      myHands[0].setVisible(true)
      myHands[1].setVisible(true)
    } else {
      myHands[0].setVisible(false)
      myHands[1].setVisible(false)
    }
  }

  setCountdown(expireAt: number) {
    const { scene } = this

    if (this.timer) {
      return
    }

    const countdownIcon = scene.make.image({ key: 'countdown' })
    const countdownText = scene.make.text({
      text: `${Math.floor((expireAt - Date.now()) / 1000)}`,
      style: { fontSize: 24, color: 'white' },
    })
    this.countdownIcon = countdownIcon
    this.countdownText = countdownText
    this.updateCountdownPosition()
    this.container.add([countdownIcon, countdownText])

    this.timer = scene.time.addEvent({
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

  clearCountdown() {
    if (this.countdownIcon && this.countdownText) {
      this.container.remove([this.countdownIcon, this.countdownText])
      this.countdownIcon.destroy()
      this.countdownText.destroy()
      this.countdownIcon = undefined
      this.countdownText = undefined
      this.timer?.destroy()
      this.timer = undefined
      this.setMyHands()
    }
  }

  setBet(bet: string, hands?: Hands) {
    this.clearCountdown()

    const betChips = BigInt(bet)
    if (betChips > 0n) {
      const betText = this.scene.make.text({
        text: (betChips / SOL_DECIMALS).toString(),
        style: { fontSize: 24 },
      })
      const betIcon = this.scene.make.image({
        key: 'my-bet',
      })
      this.betIcon = betIcon
      this.betText = betText
      this.updateBetPosition()
      this.container.add([betIcon, betText])
      this.setMyHands(hands)
    }
  }

  clearBet() {
    if (this.betIcon && this.betText) {
      this.container.remove([this.betIcon, this.betText])
      this.betIcon.destroy()
      this.betText.destroy()
      this.betIcon = undefined
      this.betText = undefined
    }
  }

  setPosition(x: number, y: number) {
    this.options.x = x
    this.options.y = y
    this.container.setPosition(x, y)
    this.updateIsOnLeft()
    this.updateAvatarPosition()
    this.updateNicknamePosition()
    this.updateMyChipsPosition()
    this.updateMyHandsPosition()
    this.updateCountdownPosition()
    this.updateBetPosition()
  }

  setState(state: Seat) {
    this.myChipsText.setText((BigInt(state.chips) / SOL_DECIMALS).toString())
    this.setMyHands(state.hands)
    this.clearBet()
  }

  destroy() {
    if (this.avatar) {
      this.container.remove([this.avatar])
      this.avatar.destroy()
    }
    if (this.nickname) {
      this.container.remove(this.nickname)
      this.nickname.destroy()
    }
    if (this.myHands) {
      this.container.remove(this.myHands)
      this.myHands.forEach((card) => card.destroy())
    }
    if (this.countdownIcon && this.countdownText) {
      this.container.remove([this.countdownIcon, this.countdownText])
      this.countdownIcon.destroy()
      this.countdownText.destroy()
      this.timer?.destroy()
    }
    if (this.betIcon && this.betText) {
      this.container.remove([this.betIcon, this.betText])
      this.betIcon.destroy()
      this.betText.destroy()
    }
    this.container.remove([this.myChipsIcon, this.myChipsText])
    this.myChipsIcon.destroy()
    this.myChipsText.destroy()
    this.container.destroy()
  }
}

export default Player
