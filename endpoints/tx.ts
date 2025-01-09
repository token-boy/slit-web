export interface TxEndpoints {
  'v1/txs': {
    POST: {
      payload: {
        tx: string
      }
      params: {}
      data: {
        signature: string
      }
    }
  }
}
