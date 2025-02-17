import { CDN_URL } from '@/lib/constants'
import { Scene } from 'phaser'

class Boot extends Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
    //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

    this.load.image('background', `${CDN_URL}/26747279705e495795427425daf0867d_tplv-tb4s082cfz-aigc_resize_2400_2400-transformed.webp?v=2`)
  }

  create() {
    this.scene.start('Preloader')
  }
}

export default Boot
