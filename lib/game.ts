import { SOL_DECIMALS } from "./constants"

export enum GameCode {
  Error = 0,
  Sync = 1,
  Bet = 2,
  Open = 3,
}

export type Hands = [number, number]

type Sync = {
  code: GameCode.Sync
  seats: Seat[]
  deckCount: number
  turn?: string
  turnExpireAt?: number
  pot: string
}

interface Bet {
  code: GameCode.Bet
  playerId: string
  bet: string
  hands: Hands
}

interface Open {
  code: GameCode.Open
  playerId: string
  card: number
}

export type Message = Sync | Bet | Open

export interface Seat {
  /**
   * The id of the player.
   */
  playerId: string

  /**
   * The amount of chips the player has staked.
   */
  chips: string

  /**
   * The hands of the player.
   */
  hands?: Hands
}

export function uiAmount(amount: string|bigint) {
  return (BigInt(amount) / SOL_DECIMALS).toString()
}
