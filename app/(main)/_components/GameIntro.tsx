"use client"

import React from "react";
import { motion } from 'framer-motion'
import Image from 'next/image'

const GameIntro: React.FC = () => {
  return (
    <section id="game" className="py-20 bg-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-8 text-center text-yellow-400">Game Introduction</h2>
        <div className="flex flex-col md:flex-row items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="md:w-1/2 mb-8 md:mb-0"
          >
            <Image
              src="/logo.webp"
              alt="Slit Poker Gameplay"
              width={400}
              height={300}
              className="rounded-lg shadow-lg"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="md:w-1/2"
          >
            <h3 className="text-2xl font-semibold mb-4 text-yellow-300">Fast-Paced Poker Action</h3>
            <p className="mb-4 text-gray-300">
              Slit Poker brings the excitement of Texas Hold&apos;em to the Solana blockchain. 
              Enjoy lightning-fast transactions, provably fair gameplay, and the chance 
              to win big in SOL!
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-300">
              <li>Instant deposits and withdrawals</li>
              <li>Low transaction fees</li>
              <li>Transparent and secure gameplay</li>
              <li>Global player pool</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default GameIntro

