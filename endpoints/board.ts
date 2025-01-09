export interface Board {
  id: string
  address: string
  chips: number
  minChips: number
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
        minChips: number
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
