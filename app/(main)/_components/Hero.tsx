'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const Hero: React.FC = () => {
  return (
    <section className="py-20 text-center relative overflow-hidden h-[128.4vw] lg:h-[42.8vw] bg-hero bg-[50%_0%] lg:bg-left-top bg-cover bg-no-repeat">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-yellow-400">
          Welcome to Slit
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-white">
          Experience the thrill of poker on the Solana blockchain!
        </p>
        <Link href="/play">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-yellow-600 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-500 transition-colors"
          >
            Play Now
          </motion.button>
        </Link>
      </motion.div>
    </section>
  )
}

export default Hero
