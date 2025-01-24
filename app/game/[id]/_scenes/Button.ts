class Button {
  container: Phaser.GameObjects.Container
  image: Phaser.GameObjects.Image
  mask:  Phaser.GameObjects.Graphics
  text: Phaser.GameObjects.Text

  constructor(options: {
    scene: Phaser.Scene
    x: number
    y: number
    width: number
    height: number
    label: string
    colors: string[]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    onClick: Function
  }) {
    const { scene, x, y, width, height, colors } = options

    // Create gradient background
    const gradientTexture = scene.textures.createCanvas(
      crypto.randomUUID(),
      width,
      height
    )
    const ctx = gradientTexture!.getContext()
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color)
    })
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Set to rounded corners
    const image = scene.add.image(0, 0, gradientTexture!)
    const mask = scene.make.graphics()
    mask.fillRoundedRect(x - width / 2, y - height / 2, width, height, 20)
    image.setMask(mask.createGeometryMask())

    const text = scene.add
      .text(0, 0, options.label, {
        fontSize: '24px',
      })
      .setOrigin(0.5)

    const container = scene.add.container(x, y, [image, text])
    container.setSize(width, height)
    container.setInteractive()
    container.on('pointerover', () => {
      image.setScale(0.94)
      mask.fillRoundedRect(
        x - width / 2 + width * 0.03,
        y - height / 2 + height * 0.03,
        width - width * 0.06,
        height - height * 0.06,
        20
      )
      text.setScale(0.94)
    })
    container.on('pointerout', () => {
      image.setScale(1)
      mask.fillRoundedRect(x - width / 2, y - height / 2, width, height, 20)
      text.setScale(1)
    })
    container.on('pointerdown', () => {
      options.onClick()
    })

    this.image = image
    this.mask = mask
    this.text = text
    this.container = container
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible)
  }

  destroy() {
    this.container.remove([this.image, this.text])
    this.image.destroy()
    this.mask.destroy()
    this.text.destroy()
    this.container.destroy()
  }
}

export default Button
