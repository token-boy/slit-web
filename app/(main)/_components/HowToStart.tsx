"use client"

import { motion } from 'framer-motion'
import { Wallet, PlayCircle, Award } from 'lucide-react'

const steps = [
  {
    icon: <Wallet className="w-12 h-12 mb-4 text-yellow-400" />,
    title: "Connect Wallet",
    description: "Link your Solana wallet to start playing"
  },
  {
    icon: <PlayCircle className="w-12 h-12 mb-4 text-yellow-400" />,
    title: "Join a Game",
    description: "Choose a table and buy in with SOL"
  },
  {
    icon: <Award className="w-12 h-12 mb-4 text-yellow-400" />,
    title: "Win Big",
    description: "Play your cards right and win SOL prizes"
  }
]

const HowToStart: React.FC = () => {
  return (
    <section id="start" className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-12 text-center text-yellow-400">How to Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="bg-gray-800 text-gray-300 rounded-lg p-6 text-center shadow-lg"
            >
              {step.icon}
              <h3 className="text-xl font-semibold mb-2 text-yellow-300">{step.title}</h3>
              <p>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowToStart

