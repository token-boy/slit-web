export interface GameEndpoints {
  // Enter
  'v1/game/:boardId/enter': {
    POST: {
      payload: {}
      params: {
        boardId: string
      }
      data: {}
    }
  }
  // Play
  'v1/game/:boardId/play': {
    POST: {
      payload: {
        chips: number
      }
      params: {
        boardId: string
      }
      data: {
        seatKey: string
        tx: string
      }
    }
  }
  // Sit
  'v1/game/:boardId/sit': {
    POST: {
      payload: {
        seatKey: string
      }
      params: {
        boardId: string
      }
      data: {}
    }
  }
  // Ping
  'v1/game/ping': {
    GET: {
      payload: {}
      params: {}
      data: {}
    }
  }
}
