import { SessionEndpoints } from './session'
import { BoardEndpoints } from './board'
import { TxEndpoints } from './tx'
import { PlayerEndpoints } from './player'
import { ChipsEnpoints } from './chips'
import { BillEndpoints } from './bill'

export type Endpoints = SessionEndpoints &
  BoardEndpoints &
  TxEndpoints &
  PlayerEndpoints &
  ChipsEnpoints &
  BillEndpoints
