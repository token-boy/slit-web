'use client'

import { memo, useState } from 'react'
import GameCard from './GameCard'
import { Button } from '@/components/ui/button'
import { useEndpoint } from '@/lib/request'

function GameList() {
  const [currentPage, setCurrentPage] = useState(1)

  const { data: boards = [] } = useEndpoint('v1/boards', {
    method: 'GET',
    manual: false,
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-8">
        {boards.map((board) => (
          <GameCard key={board.id} board={board} />
        ))}
      </div>
      <div className="flex justify-center space-x-2">
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          上一页
        </Button>
        <span className="py-2 px-4 bg-gray-800 text-white rounded">
          {currentPage} / {1}
        </span>
        <Button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, 1))}
          disabled={currentPage === 1}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          下一页
        </Button>
      </div>
    </div>
  )
}

export default memo(GameList)
