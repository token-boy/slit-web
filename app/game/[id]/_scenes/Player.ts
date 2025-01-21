import { SOL_DECIMALS } from '@/lib/constants'
import { Hands, SeatState } from '@/lib/game'
import { getUrl, request } from '@/lib/request'
import { cardNames } from '../cards'

interface PlayerOptions {
  scene: Phaser.Scene
  x: number
  y: number
  width: number
  height: number
  id: string
  chips: string
  hands?: Hands
}

class Player {
  options: PlayerOptions
  container: Phaser.GameObjects.Container
  isOnLeft: boolean
  avatar: Phaser.GameObjects.Image
  avatarMask: Phaser.GameObjects.Graphics
  nickname: Phaser.GameObjects.Text
  myChipsIcon: Phaser.GameObjects.Image
  myChipsText: Phaser.GameObjects.Text
  myHands: Phaser.GameObjects.Image[] = []
  countdownIcon?: Phaser.GameObjects.Image
  countdownText?: Phaser.GameObjects.Text
  timer?: NodeJS.Timeout
  betIcon?: Phaser.GameObjects.Image
  betText?: Phaser.GameObjects.Text
  id: string

  constructor(options: PlayerOptions) {
    this.options = options

    const { scene, x, y, width, height } = options
    this.id = options.id

    const container = scene.add.container(x, y)
    container.setSize(width, height)

    this.updateIsOnLeft()

    // Load player profile
    request(getUrl(`v1/players/${options.id}`)).then((profile) => {
      const avatarUrl = `https://files.mxsyx.site/${profile.avatarUrl}`

      // Create avatar
      scene.load.image(avatarUrl, avatarUrl).once('complete', () => {
        const image = scene.make.image({ key: avatarUrl })
        this.avatarMask = scene.make.graphics()
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
  }

  /**
   * Make object on the right side of the screen appear correctly.
   */
  private updateIsOnLeft() {
    const { scene, x, width } = this.options
    const canvasWidth = scene.game.config.width as number
    this.isOnLeft = x < canvasWidth / 2 + width
  }

  private updateAvatarPosition() {
    const { x, y, width, height } = this.options
    const size = width / 3
    console.log(this, this.avatar);
    
    this.avatar
      .setPosition(this.isOnLeft ? -width / 2 : width / 2, -height / 2)
      .setOrigin(this.isOnLeft ? 0 : 1, 0)
      .setDisplaySize(size, size)
    this.avatarMask.fillRoundedRect(
      this.isOnLeft ? x - width / 2 : x + width / 2 - size,
      y - height / 2,
      size,
      size,
      50
    )
    this.avatar.setMask(this.avatarMask.createGeometryMask())
  }

  private updateNicknamePosition() {
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

  private updateMyHands(hands?: Hands) {
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

  private updateMyHandsPosition() {
    const { width } = this.options
    const cardWidth = 60
    const cardHeight = 84

    const positionX = -width / 2 + width / 3 / 2 - (cardWidth + 10) / 2
    const originX = this.isOnLeft ? 0 : 1
    this.myHands[1]
      .setPosition(this.isOnLeft ? positionX : -positionX, width / 3 / 2 + 10)
      .setOrigin(originX, 0)
      .setDisplaySize(cardWidth, cardHeight)
    this.myHands[0]
      .setPosition(
        this.myHands[1].x + (this.isOnLeft ? 10 : -10),
        this.myHands[1].y
      )
      .setOrigin(originX, 0)
      .setDisplaySize(cardWidth, cardHeight)
  }

  setPosition(x: number, y: number) {
    this.options.x = x
    this.options.y = y
    this.container.setPosition(x, y)
    this.updateIsOnLeft()
    this.updateAvatarPosition()
    this.updateNicknamePosition()
    this.updateMyChipsPosition()
  }

  setState(state: SeatState) {
    this.myChipsText.setText((BigInt(state.chips) / SOL_DECIMALS).toString())
    this.updateMyHands(state.hands)
    this.clearBet()
  }

  private updateBetPosition() {
    if (this.betIcon && this.betText) {
      const { width } = this.options
      this.betIcon.setPosition(0, width / 3 / 2 + 36).setDisplaySize(48, 48)
      this.betText.setPosition(this.betIcon.x, this.betIcon.y).setOrigin(0.5)
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

  setBet(bet: string, hands?: Hands) {
    const { scene } = this.options

    this.clearCountdown()

    const betChips = BigInt(bet)
    if (betChips > 0n) {
      const betText = scene.make.text({
        text: (betChips / SOL_DECIMALS).toString(),
        style: { fontSize: 24 },
      })
      const betIcon = scene.make.image({
        key: 'my-bet',
      })
      this.betIcon = betIcon
      this.betText = betText
      this.updateBetPosition()
      this.container.add([betIcon, betText])
      this.updateMyHands(hands)
    }
  }

  updateCountdownPosition() {
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

  clearCountdown() {
    if (this.countdownIcon && this.countdownText) {
      this.container.remove([this.countdownIcon, this.countdownText])
      this.countdownIcon.destroy()
      this.countdownText.destroy()
      this.countdownIcon = undefined
      this.countdownText = undefined
      clearInterval(this.timer)
      this.updateMyHands()
    }
  }

  setCountdown(expireAt: number) {
    const { scene } = this.options

    const countdownIcon = scene.make.image({ key: 'countdown' })
    const countdownText = scene.make.text({
      text: `${Math.floor((expireAt - Date.now()) / 1000)}`,
      style: { fontSize: 24, color: 'white' },
    })
    this.countdownIcon = countdownIcon
    this.countdownText = countdownText
    this.updateCountdownPosition()
    this.container.add([countdownIcon, countdownText])

    this.timer = setInterval(() => {
      const now = Date.now()
      if (expireAt < now) {
        this.clearCountdown()
        return
      }
      countdownText.setText(`${Math.floor((expireAt - now) / 1000)}`)
    }, 1000)
  }
}

export default Player
