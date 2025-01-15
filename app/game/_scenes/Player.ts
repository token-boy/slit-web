interface PlayerOptions {
  scene: Phaser.Scene
  x: number
  y: number
  width: number
  height: number
  id: string
  avatarUrl: string
  nickname: string
  chips: number
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
  id: string

  constructor(options: PlayerOptions) {
    this.options = options

    const { scene, x, y, width, height, avatarUrl } = options
    this.id = options.id

    const container = scene.add.container(x, y)
    container.setSize(width, height)

    this.updateIsOnLeft()

    // Create avatar
    scene.load.image(avatarUrl, avatarUrl).once('complete', () => {
      const image = scene.make.image({ key: avatarUrl })
      this.avatarMask = scene.make.graphics()
      this.avatar = image
      this.updateAvatarPosition()
      container.add(image)
    })

    // Create nickname
    const nickname = scene.make.text({
      text: options.nickname,
      style: { fontSize: 24 },
    })
    this.nickname = nickname
    this.updateNicknamePosition()
    container.add(nickname)

    // Create my chips
    const icon = scene.make.image({ key: 'my-chips' })
    const text = scene.make.text({
      text: options.chips.toString(),
      style: { fontSize: 24 },
    })
    this.myChipsIcon = icon
    this.myChipsText = text
    this.updateMyChipsPosition()
    container.add([icon, text])

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

    const originX = -width / 2 + width / 3 + 10
    this.nickname
      .setPosition(this.isOnLeft ? originX : -originX, -height / 2 + 12)
      .setOrigin(this.isOnLeft ? 0 : 1, 0)
  }

  private updateMyChipsPosition() {
    const { width, height } = this.options
    const size = width / 6

    const originX = -width / 2 + width / 3 + 10
    const originY = -height / 2 + 50
    this.myChipsIcon
      .setPosition(this.isOnLeft ? originX : -originX, originY)
      .setOrigin(this.isOnLeft ? 0 : 1, 0)
      .setDisplaySize(size, size)
    this.myChipsText
      .setPosition(
        this.isOnLeft ? originX + size + 10 : -originX - size - 10,
        originY + size / 2
      )
      .setOrigin(this.isOnLeft ? 0 : 1, 0.5)
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
}

export default Player
