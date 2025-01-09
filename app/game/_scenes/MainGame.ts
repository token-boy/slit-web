import { GameObjects, Scene } from 'phaser'

class MainGame extends Scene {
  background: GameObjects.Image
  deck: GameObjects.Image[] = []

  constructor() {
    super('MainGame')
  }

  create() {
    const width = this.sys.game.config.width as number
    const height = this.sys.game.config.height as number

    this.background = this.add
      .image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(width, height)

    const trigger = this.add.image(400, 600, 'Deck').setInteractive()

    // const cardWidth = 300
    const cardHeight = 420
    const gap = 20
    const deskX = width / 2 - (gap * 51) / 2
    const deskY = height / 2

    for (let i = 0; i < 52; i++) {
      this.deck.push(
        this.add.image(deskX + gap * i, deskY, 'Deck').setDepth((52 - i) * 10)
      )
    }

    trigger.on('pointerdown', () => {
      const card1 = this.deck.shift()
      card1?.setTexture('HeartsAce')
      this.tweens.add({
        targets: card1,
        x: width / 2 - gap,
        y: height - cardHeight,
        duration: 500,
        ease: 'Power2',
      })
      card1?.setDepth(99)

      const card2 = this.deck.shift()
      card2?.setTexture('ClubsKing')
      this.tweens.add({
        targets: card2,
        x: width / 2,
        y: height - cardHeight,
        duration: 500,
        ease: 'Power2',
      })
      card2?.setDepth(100)
    })
  }
}

export default MainGame
