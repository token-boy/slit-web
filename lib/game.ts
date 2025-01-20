export enum GameCode {
  Error = 0,
  Sync = 1,
  Bet = 2,
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
