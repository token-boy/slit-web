'use client'

import React from 'react'

import { IS_DEV } from '@/lib/constants'
import { isMobileDevice } from '@/lib/utils'

const DevTools: React.FC= () => {
  React.useEffect(() => {
    if (IS_DEV && isMobileDevice()) {
      import('eruda').then((eruda) => eruda.default.init())
    }
  }, [])

  return null
}

export default DevTools
