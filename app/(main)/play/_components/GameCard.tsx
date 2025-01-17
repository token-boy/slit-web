'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Board } from '@/endpoints/board'
import { motion } from 'framer-motion'
import { Users, Eye, Clock, Coins, Database } from 'lucide-react'
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
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <Users className="mr-2" size={16} />
                <span>{0} Players</span>
              </div>
              <div className="flex items-center">
                <Eye className="mr-2" size={16} />
                <span>{1000} Watchers</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2" size={16} />
                <span>{600} Minutes</span>
              </div>
              <div className="flex items-center">
                <Coins className="mr-2" size={16} />
                <span>{board.minChips} Min chips</span>
              </div>
              <div className="flex items-center col-span-2">
                <Database className="mr-2" size={16} />
                <span>{board.chips} Chips pool</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}

export default GameCard
