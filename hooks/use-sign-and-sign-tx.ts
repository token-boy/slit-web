import { useContext, useState } from 'react'

import { AccountContext } from '@/lib/providers'
import { useEndpoint } from '@/lib/request'
import { signTx } from '@/lib/wallet'

import { toast } from './use-toast'
import { IS_DEV } from '@/lib/constants'

function useSignAndSendTx(onSuccess?: (signature: string) => void) {
  const { account } = useContext(AccountContext)

  const [signLoading, setSignLoading] = useState<boolean>(false)

  const { loading: sendLoading, runAsync: sendTx } = useEndpoint('v1/txs', {
    method: 'POST',
    onSuccess: (data) => {
      if (IS_DEV) {
        console.log(`Transaction sent: ${data.signature}`)
      }
      onSuccess && onSuccess(data.signature)
    },
  })

  return {
    loading: signLoading || sendLoading,
    signAndSendTx: async (tx: string, providerMount?: string) => {
      const transaction = await signTx(
        tx,
        providerMount ?? account!.provider.mount
      )
        .catch((error) => {
          toast({ title: 'You cancelled the transaction.' })
          throw error
        })
        .finally(() => {
          setSignLoading(false)
        })
      return sendTx({
        tx: btoa(String.fromCharCode.apply(null, transaction.serialize())),
      })
    },
  }
}

export default useSignAndSendTx
