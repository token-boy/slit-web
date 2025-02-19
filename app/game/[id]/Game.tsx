import { useLayoutEffect, useRef, useState } from 'react'
import { CANVAS, Game as PhaserGame } from 'phaser'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import Boot from './Boot'
import Preloader from './Preloader'
import MainGame from './MainGame'
import { Input } from '@/components/ui/input'
import { EventBus } from './EventBus'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { SOL_DECIMALS } from '@/lib/constants'
import WalletConnector from '@/components/WalletConnector'

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
  return new PhaserGame({ ...config, parent })
}

const Game: React.FC = () => {
  const game = useRef<Phaser.Game | null>(null)

  const [betInputOpen, setBetInputOpen] = useState<boolean>(false)
  const betInput = useRef<HTMLInputElement>(null)

  const [stakeInputOpen, setStakeInputOpen] = useState<boolean>(false)
  const stakeInput = useRef<HTMLInputElement>(null)

  const [exitConfirmOpen, setExitConfirmOpen] = useState<boolean>(false)

  const walletConnector = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (game.current === null) {
      game.current = startGame('game-container')
    }

    EventBus.on('open-bet-input', () => {
      setBetInputOpen(true)
    })
    EventBus.on('open-stake-input', () => {
      setStakeInputOpen(true)
    })
    EventBus.on('open-exit-confirm', () => {
      setExitConfirmOpen(true)
    })
    EventBus.on('open-wallet-connector', () => {
      walletConnector.current?.click()
    })

    return () => {
      if (game.current) {
        game.current.destroy(true)
        game.current = null
      }
    }
  }, [])

  return (
    <div id="game-container" className="cursor-pointer">
      <Dialog open={betInputOpen} onOpenChange={setBetInputOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Input bet</DialogTitle>
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
                setBetInputOpen(false)
              }}
            >
              Bet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={stakeInputOpen} onOpenChange={setStakeInputOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Input chips</DialogTitle>
          </DialogHeader>
          <Input ref={stakeInput} />
          <DialogFooter>
            <Button
              onClick={() => {
                const value = parseInt(stakeInput.current!.value)
                if (isNaN(value)) {
                  toast({ title: 'Invalid chips' })
                  return
                }
                EventBus.emit(
                  'stake-input-submited',
                  BigInt(value) * SOL_DECIMALS
                )
                setStakeInputOpen(false)
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={exitConfirmOpen} onOpenChange={setExitConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Warning</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to exit the game?</p>
          <p>Remaining chips will be returned to your account.</p>
          <DialogFooter>
            <Button
              onClick={() => {
                EventBus.emit('exit-confirmed')
                setExitConfirmOpen(false)
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className='hidden'>
      <WalletConnector ref={walletConnector} />
      </div>
    </div>
  )
}

export default Game
