import { SessionEndpoints } from './session'
import { BoardEndpoints } from './board'
import { GameEndpoints } from './game'
import { TxEndpoints } from './tx'
import { PlayerEndpoints } from './player'
import { ChipsEnpoints } from './chips'

export type Endpoints = SessionEndpoints &
  BoardEndpoints &
  GameEndpoints &
  TxEndpoints &
  PlayerEndpoints &
  ChipsEnpoints
