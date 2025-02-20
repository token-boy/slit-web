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
      payload: {
        amount: string
      }
      params: {}
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
