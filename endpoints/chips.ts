export interface ChipsEnpoints {
  'v1/chips': {
    POST: {
      payload: {
        amount: string
      }
      params: {}
      data: {
        tx: string
      }
    }
    DELETE: {
      payload: {}
      params: {
        amount: string
      }
      data: {
        tx: string
      }
    }
    GET: {
      payload: {}
      params: {}
      data: {
        amount: string
      }
    }
  }
}
