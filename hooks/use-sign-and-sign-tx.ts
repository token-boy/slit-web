import { useState } from 'react'

import { getUrl, request } from '@/lib/request'
import { signTx } from '@/lib/wallet'

import { toast } from './use-toast'
import { IS_DEV } from '@/lib/constants'

export async function signAndSendTx(tx: string) {
  const providerMount = sessionStorage.getItem('providerMount')
  if (!providerMount) {
    throw new Error('No provider found')
  }

  const transaction = await signTx(tx, providerMount).catch((error) => {
    toast({ title: 'You cancelled the transaction.' })
    throw error
  })
  const { signature } = await request(getUrl('v1/txs'), {
    method: 'POST',
    payload: {
      tx: btoa(String.fromCharCode.apply(null, transaction.serialize())),
    },
  })
  if (IS_DEV) {
    console.log(`Transaction sent: ${signature}`)
  }
  return signature
}

function useSignAndSendTx(onSuccess?: (signature: string) => void) {
  const [loading, setLoading] = useState<boolean>(false)

  return {
    loading,
    signAndSendTx: async (tx: string) => {
      setLoading(true)
      try {
        await signAndSendTx(tx)
        if (onSuccess) {
          onSuccess(tx)
        }
      } finally {
        setLoading(false)
      }
    },
  }
}

export default useSignAndSendTx
