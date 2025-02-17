class Control {
  constructor(options: {
    scene: Phaser.Scene
    x: number
    y: number
    width?: number
    height?: number
    tips: string
    icon: string
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    onClick: Function
  }) {
    const { scene, x, y, width = 32, height = 32, icon, tips } = options

    let tipsText: Phaser.GameObjects.Text | null = null
    scene.add
      .image(x, y, icon)
      .setDisplaySize(width, height)
      .setInteractive()
      .on('pointerover', () => {
        tipsText = scene.add
          .text(x, y - 50, tips, {
            fontSize: '20px',
            color: '#fff',
            backgroundColor: '#000',
            padding: {x: 4, y: 2},
          })
          .setOrigin(0.5)
      })
      .on('pointerout', () => {
        if (tipsText) {
          tipsText.destroy()
        }
      })
      .on('pointerdown', () => {
        options.onClick()
      })
  }
}

export default Control
