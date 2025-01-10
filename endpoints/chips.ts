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
  }
}
