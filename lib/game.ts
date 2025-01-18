export enum GameCode {
  Error = 0,
  Sync = 1,
  Turn = 2,
  Open = 3,
}

export type Hands = [number, number]

export interface SeatState {
  playerId: string
  hands?: Hands
  chips: string
}

type Sync = {
  code: GameCode.Sync
  seats: SeatState[]
  deckCount: number
  turn?: string
  turnExpireAt?: number
  pot: string
}

interface Turn {
  code: GameCode.Turn
  playerId: string
  bet: string
  hands: Hands
}

export type Message = Sync | Turn

export interface Seat {
  /**
   * The owner address of the player.
   */
  owner: string

  /**
   * The id of the board.
   */
  boardId: string

  /**
   * The id of the player.
   */
  playerId: string

  /**
   * The amount of chips the player has staked.
   */
  chips: string

  /**
   * `unready`: Wait for the transaction of stake chips to be confirmed.
   * `ready`: The transaction of stake chips has been confirmed.
   * `playing`: Game is in progress.
   * `settling`: Game is settling.
   */
  status: 'unready' | 'ready' | 'playing' | 'settling'
}
