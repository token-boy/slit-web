'use client'

import { VersionedTransaction } from '@solana/web3.js'
import { sleep } from './utils'
import { CDN_URL } from './constants'

export interface Account {
  address: string
  provider: {
    name: string
    logo: string
    mount: string
  }
}

export const providers = [
  {
    name: 'Phantom',
    mount: 'phantom',
    url: 'https://phantom.app/',
    logo: `${CDN_URL}/phantom.png`,
  },
  {
    name: 'Solflare',
    mount: 'solflare',
    url: 'https://solflare.com/',
    logo: `${CDN_URL}/solflare.png`,
  },
  {
    name: 'Nightly',
    mount: 'nightly',
    url: 'https://nightly.app/',
    logo: `${CDN_URL}/nightly.png`,
  },
  {
    name: 'Backpack',
    mount: 'backpack',
    url: 'https://backpack.app/',
    logo: `${CDN_URL}/backpack.png`,
  },
  {
    name: 'OKX',
    mount: 'okxwallet',
    url: 'https://www.okx.com/web3',
    logo: `${CDN_URL}/okxwallet.png`,
  },
]

export async function getConnector(mount: string) {
  let count = 10
  while (count--) {
    const descriptor = Object.getOwnPropertyDescriptor(window, mount)
    if (descriptor) {
      return descriptor.value.solana ?? descriptor.value
    }
    await sleep(300)
  }

  throw new Error('Failed to get connector')
}

export async function signTx(tx: string, providerMount: string) {
  const binaryString = atob(tx)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const transaction = VersionedTransaction.deserialize(bytes)
  const connector = await getConnector(providerMount)
  return connector.signTransaction(transaction)
}
