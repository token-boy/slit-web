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
}
