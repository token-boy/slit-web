import { useLayoutEffect, useRef } from 'react'
import { CANVAS, Game as PhaserGame } from 'phaser'

import Boot from './_scenes/Boot'
import Preloader from './_scenes/Preloader'
import MainGame from './_scenes/MainGame'

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
  type: CANVAS,
  width: window.innerWidth * window.devicePixelRatio,
  height: window.innerHeight * window.devicePixelRatio,
  parent: 'game-container',
  scene: [Boot, Preloader, MainGame],
  scale: {
    mode: Phaser.Scale.FIT,
  },
}

function startGame(parent: string) {
  return new PhaserGame({ ...config, parent, })
}

const Game: React.FC = () => {
  const game = useRef<Phaser.Game | null>(null)

  useLayoutEffect(() => {
    if (game.current === null) {
      game.current = startGame('game-container')
    }

    return () => {
      if (game.current) {
        game.current.destroy(true)
        game.current = null
      }
    }
  }, [])

  return <div id="game-container"></div>
}

export default Game
