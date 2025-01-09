export interface SessionEndpoints {
  // Sign In
  'v1/sessions': {
    POST: {
      payload: {
        address: string
        timestamp: string
        signature: string
      }
      params: {}
      data: {
        accessToken: string
        isNew: boolean
      }
    }
  }
}
