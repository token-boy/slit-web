'use client'

import dynamic from 'next/dynamic'

const Game = dynamic(() => import('./Game'), { ssr: false })

function App() {
  return <Game />
}

export default App
