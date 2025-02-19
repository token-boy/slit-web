import { drawRoundedCorner } from "./utils"

class Button {
  container: Phaser.GameObjects.Container
  image: Phaser.GameObjects.Image
  text: Phaser.GameObjects.Text

  constructor(options: {
    container: Phaser.GameObjects.Container
    x: number
    y: number
    width: number
    height: number
    label: string
    colors: string[]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    onClick: Function
  }) {
    const { container: parent, x, y, width, height, colors } = options
    const { scene } = parent

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
    drawRoundedCorner(gradientTexture!, 20)
    ctx.fillRect(0, 0, width, height)

    const image = scene.make.image({
      x: 0,
      y: 0,
      key: gradientTexture!,
    })

    const text = scene.make
      .text({
        x: 0,
        y: 0,
        text: options.label,
        style: {
          fontSize: '24px',
        },
      })
      .setOrigin(0.5)

    const container = scene.make.container({
      x,
      y,
      children: [image, text],
    })

    container.setSize(width, height)
    container.setInteractive()
    container.on('pointerover', () => {
      image.setScale(0.94)
      text.setScale(0.94)
    })
    container.on('pointerout', () => {
      image.setScale(1)
      text.setScale(1)
    })
    container.on('pointerdown', () => {
      options.onClick()
    })

    this.image = image
    this.text = text
    this.container = container

    parent.add(container)
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible)
  }

  destroy() {
    this.container.remove([this.image, this.text])
    this.image.destroy()
    this.text.destroy()
    this.container.destroy()
  }
}

export default Button
