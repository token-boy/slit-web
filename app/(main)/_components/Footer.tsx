const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-400">&copy; 2025 Slit Poker. All rights reserved.</p>
        <p className="mt-2 text-gray-500">
          <a href="#" className="hover:text-yellow-400 transition-colors">Terms of Service</a>
          {' | '}
          <a href="#" className="hover:text-yellow-400 transition-colors">Privacy Policy</a>
        </p>
      </div>
    </footer>
  )
}

export default Footer

