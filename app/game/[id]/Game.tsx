import { useLayoutEffect, useRef, useState } from 'react'
import { CANVAS, Game as PhaserGame } from 'phaser'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import Boot from './_scenes/Boot'
import Preloader from './_scenes/Preloader'
import MainGame from './_scenes/MainGame'
import { Input } from '@/components/ui/input'
import { EventBus } from './EventBus'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { SOL_DECIMALS } from '@/lib/constants'

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
  type: CANVAS,
  width: window.innerWidth * window.devicePixelRatio,
  height: window.innerHeight * window.devicePixelRatio,
  parent: 'game-container',
  scene: [Boot, Preloader, MainGame],
  // backgroundColor: '#212121',
  scale: {
    mode: Phaser.Scale.FIT,
  },
}

function startGame(parent: string) {
  return new PhaserGame({ ...config, parent })
}

const Game: React.FC = () => {
  const game = useRef<Phaser.Game | null>(null)

  const [open, setOpen] = useState<boolean>(false)
  const betInput = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    if (game.current === null) {
      game.current = startGame('game-container')
    }

    EventBus.on('open-bet-input', () => {
      setOpen(true)
    })

    return () => {
      if (game.current) {
        game.current.destroy(true)
        game.current = null
      }
    }
  }, [])

  return (
    <div id="game-container">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select bet</DialogTitle>
          </DialogHeader>
          <Input ref={betInput} />
          <DialogFooter>
            <Button
              onClick={() => {
                const value = parseInt(betInput.current!.value)
                if (isNaN(value)) {
                  toast({ title: 'Invalid bet' })
                  return
                }
                EventBus.emit(
                  'bet-input-submited',
                  BigInt(value) * SOL_DECIMALS
                )
                setOpen(false)
              }}
            >
              Bet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Game
