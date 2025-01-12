export interface GameEndpoints {
  // Sign In
  'v1/play': {
    POST: {
      payload: {
        boardId: string
        chips: number
      }
      params: {}
      data: {
        gsKey: string
        tx: string
      }
    }
  }
  // Sit
  'v1/sit': {
    POST: {
      payload: {
        gsKey: string
      }
      params: {}
      data: {}
    }
  }
}
