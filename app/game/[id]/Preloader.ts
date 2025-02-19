import { Scene } from 'phaser'
import cards from './cards'
import { CDN_URL } from '@/lib/constants'
import { getSize } from './utils'
import { isMobileDevice } from '@/lib/utils'

class Preloader extends Scene {
  constructor() {
    super('Preloader')
  }

  init() {
    const { width, height } = getSize(this)

   const container = this.make
      .container({})
      .setSize(width, height)
      .setDisplaySize(width, height)
    if (isMobileDevice()) {
      container.setPosition(height, 0)
      container.setRotation(Math.PI / 2)
    }

    // Game background
    const background = this.make
      .image({ x: 0, y: 0, key: 'background' })
      .setOrigin(0)
      .setDisplaySize(width, height)
    container.add(background)

    // Progress bar
    const outline= this.add.rectangle(width/2, height/2, 468, 32).setStrokeStyle(1, 0xd18c26)
    const bar = this.add.rectangle(width/2 - 230, height/2, 4, 28, 0xad7111)
    container.add([outline, bar])

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on('progress', (progress: number) => {
      bar.width = 4 + 460 * progress
    })
  }

  async preload() {
    this.load.setPath(CDN_URL)
    this.load.image('my-chips', 'my-chips.webp?v=2')
    this.load.image('countdown', 'countdown.webp?v=2')
    this.load.image('my-bet', 'my-bet.webp?v=2')
    this.load.image('pot', 'pot.webp?v=2')
    this.load.image('stake', 'stake.png?v=3')
    this.load.image('exit', 'exit.png?v=3')
    this.load.image('back', 'back.png?v=3')
    this.load.image('mute', 'mute.png?v=3')
    this.load.image('unmute', 'unmute.png?v=3')
    this.load.image('start', 'start.webp?v=3')
    this.load.audio('background-music', 'background.mp3?v=2')
    this.load.audioSprite('sounds-chinese', 'sounds-chinese.json?v=2', [
      'sounds-chinese.mp3?v=2',
    ])
    this.load.audio('start', 'start.mp3?v=2')

    await Promise.all(
      Object.entries(cards).map(([name, data]) => {
        return new Promise((resolve) => {
          const canvas = document.createElement('canvas')
          const image = new Image(300, 420)
          image.src = data
          image.onload = () => {
            canvas.width = image.naturalWidth
            canvas.height = image.naturalHeight
            const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
            this.textures.addCanvas(name, canvas)
            resolve(null)
          }
        })
      })
    )
  }

  create() {
    this.scene.start('MainGame')
  }
}

export default Preloader
