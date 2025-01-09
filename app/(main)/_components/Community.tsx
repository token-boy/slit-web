"use client"

import { motion } from 'framer-motion'
import { Twitter, DiscIcon as Discord, Github } from 'lucide-react'

const Community: React.FC = () => {
  return (
    <section id="community" className="py-20 bg-gray-800">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8 text-yellow-400">Join Our Community</h2>
        <p className="text-xl mb-12 text-gray-300">Connect with other players and stay updated on the latest news and tournaments!</p>
        <div className="flex justify-center space-x-8">
          <motion.a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-yellow-600 p-4 rounded-full"
          >
            <Twitter className="w-8 h-8 text-white" />
          </motion.a>
          <motion.a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-yellow-600 p-4 rounded-full"
          >
            <Discord className="w-8 h-8 text-white" />
          </motion.a>
          <motion.a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-yellow-600 p-4 rounded-full"
          >
            <Github className="w-8 h-8 text-white" />
          </motion.a>
        </div>
      </div>
    </section>
  )
}

export default Community

