'use client'

import { motion } from 'framer-motion'

const Hero: React.FC = () => {
  return (
    <section className="py-20 text-center relative overflow-hidden h-[80vh] bg-hero bg-[length:100%_42.8vw] bg-no-repeat">
      {/* <div className="absolute left-0 top-1/4 transform -translate-x-1/2 -rotate-12">
        <Image 
          src="/ace-of-diamonds.png" 
          alt="Ace of Diamonds" 
          width={200} 
          height={280} 
          onLoad={() => setAceLoaded(true)}
          onError={(e) => {
            e.currentTarget.onerror = null; 
            e.currentTarget.src = '/placeholder.svg?height=280&width=200';
          }}
          style={{ display: aceLoaded ? 'block' : 'none' }}
        />
      </div>
      <div className="absolute right-0 bottom-1/4 transform translate-x-1/2 rotate-12">
        <Image 
          src="/king-of-clubs.png" 
          alt="King of Clubs" 
          width={200} 
          height={280}
          onLoad={() => setKingLoaded(true)}
          onError={(e) => {
            e.currentTarget.onerror = null; // prevents looping
            e.currentTarget.src = '/placeholder.svg?height=280&width=200';
          }}
          style={{ display: kingLoaded ? 'block' : 'none' }}
        />
      </div> */}
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-yellow-600 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-500 transition-colors"
        >
          Play Now
        </motion.button>
      </motion.div>
    </section>
  )
}

export default Hero
