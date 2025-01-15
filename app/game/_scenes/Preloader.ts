import { Scene } from 'phaser'
import cards from '../cards'

class Preloader extends Scene {
  constructor() {
    super('Preloader')
  }

  init() {
    const width = this.sys.game.config.width as number
    const height = this.sys.game.config.height as number
    
     this.add
      .image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(width, height)

      //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff)

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff)

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on('progress', (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress
    })
  }

  async preload() {
    // this.load.setPath('assets')
    this.load.image('cursorx', 'cursor.webp')
    this.load.image('my-chips', 'https://files.mxsyx.site/my-chips.webp')

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
