
/**
 * Creates a button with a gradient background and rounded corners.
 *
 * @param scene - The Phaser scene to add the button to.
 * @param  x - The x-coordinate of the button.
 * @param y - The y-coordinate of the button.
 * @param width - The width of the button.
 * @param height - The height of the button.
 * @param label - The label to display on the button.
 * @returns The button container.
 */
export function createButton(options: {
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

  const button = scene.add.container(x, y, [image, text])
  button.setSize(width, height)
  button.setInteractive()
  button.on('pointerover', () => {
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
  button.on('pointerout', () => {
    image.setScale(1)
    mask.fillRoundedRect(x - width / 2, y - height / 2, width, height, 20)
    text.setScale(1)
  })
  button.on('pointerdown', () => {
    options.onClick()
  })

  return button
}
