export interface PlayerEndpoints {
  // Create player
  'v1/players': {
    POST: {
      payload: {}
      params: {}
      data: {
        tx: string
      }
    }
  }
  'v1/players/profile': {
    GET: {
      payload: {}
      params: {}
      data: {
        avatarUrl: string
        nickname: string
      }
    },
    PUT: {
      payload: {
        avatarUrl: string
        nickname: string
      }
      params: {}
      data: {}
    }
  }
}
