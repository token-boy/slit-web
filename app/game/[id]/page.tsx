'use client'

import dynamic from 'next/dynamic'

const Game = dynamic(() => import('./Game'), { ssr: false })

function App() {
  return (
    <div id="app">
      <Game />
    </div>
  )
}

export default App
