export interface Board {
  id: string
  address: string
  chips: number
  limit: number
  players: number
  createdAt: number
}

export interface BoardEndpoints {
  'v1/boards': {
    GET: {
      payload: {}
      params: {
        page: number
        minPlayers: string
        limit: string
      }
      data: {
        boards: Board[],
        total: number
      }
    },
    POST: {
      payload: {
        limit: string
      }
      params: {
        page: number
      }
      data: {
        tx: string
      }
    }
  }
}
