'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Board } from '@/endpoints/board'
import { uiAmount } from '@/lib/game'
import { motion } from 'framer-motion'
import { Users, Clock, Coins, Database } from 'lucide-react'
import Link from 'next/link'

const GameCard: React.FC<{ board: Board }> = ({ board }) => {
  return (
    <Link href={`/game/${board.id}`}>
      <motion.div
        initial={{ scale: 1 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        className="w-full lg:w-auto"
      >
        <Card className="bg-gray-800 text-white mb-8 cursor-pointer">
          <CardHeader>
            <CardTitle>Game #{board.id}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <Users className="mr-2" size={16} />
              <span>{board.players} Players</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2" size={16} />
              <span>
                {Math.floor((Date.now() - board.createdAt) / 1000 / 60)} Minutes
              </span>
            </div>
            <div className="flex items-center">
              <Coins className="mr-2" size={16} />
              <span>{uiAmount(BigInt(board.limit))} Limit</span>
            </div>
            <div className="flex items-center">
              <Database className="mr-2" size={16} />
              <span>{uiAmount(BigInt(board.chips))} Chips pool</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}

export default GameCard
