export enum BillType {
  Deposit = 0,
  Withdraw = 1,
  Stake = 2,
  Redeem = 3,
}

export interface Bill {
  _id: string
  owner: string
  type: BillType
  amount: string
  fee?: string
  boardId?: string
  seatKey?: string
  confirmed: boolean
  signature?: string
  createdAt: number
}

export interface BillEndpoints {
  'v1/bills': {
    GET: {
      payload: {}
      params: {
        type?: string
        boardId?: string
        page: number
      }
      data: {
        bills: Bill[]
        total: number
      }
    }
  }
  'v1/game/:boardId/redeem': {
    POST: {
      payload: {
        seatKey: string
      }
      params: {
        boardId: string
      }
      data: {
        tx: string
      }
    }
  }
}
