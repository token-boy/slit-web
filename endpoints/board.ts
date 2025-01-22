export interface Board {
  id: string
  address: string
  chips: number
  limit: number
}

export interface BoardEndpoints {
  'v1/boards': {
    GET: {
      payload: {}
      params: {
        page: number
      }
      data: Board[]
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
