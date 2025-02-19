class Control {
  image: Phaser.GameObjects.Image

  constructor(options: {
    container: Phaser.GameObjects.Container
    x: number
    y: number
    width?: number
    height?: number
    tips?: string
    icon: string
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    onClick: Function
  }) {
    const { container, x, y, width = 64, height = 64, icon, tips } = options

    let tipsText: Phaser.GameObjects.Text | null = null
    this.image = container.scene.make
      .image({ x, y, key: icon })
      .setDisplaySize(width, height)
      .setInteractive()
      .on('pointerover', () => {
        if (tips) {
          tipsText = container.scene.make
          .text({
            x,
            y: y - 50,
            text: tips,
            style: {
              fontSize: '20px',
              color: '#fff',
              backgroundColor: '#000',
              padding: { x: 4, y: 2 },
            },
          })
          .setOrigin(0.5)
        }
      })
      .on('pointerout', () => {
        if (tipsText) {
          tipsText.destroy()
        }
      })
      .on('pointerdown', () => {
        options.onClick()
      })

    container.add(this.image)
  }

  setIcon(key: string) {
    this.image.setTexture(key)
  }
}

export default Control
