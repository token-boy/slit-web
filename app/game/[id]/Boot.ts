import { Scene } from 'phaser'

import { CDN_URL } from '@/lib/constants'

class Boot extends Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
    //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

    this.load.image('background', `${CDN_URL}/background.webp?v=10`)
  }

  create() {
    this.scene.start('Preloader')
  }
}

export default Boot
