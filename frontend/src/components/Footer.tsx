import { motion } from 'framer-motion'
import { Instagram, Linkedin, Mail, Heart } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-white/50 backdrop-blur-md border-t border-gray-100 mt-auto pb-safe">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Copyright & Credits */}
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Nimbus<span className="text-gradient">Cloud</span> © {currentYear}
            </p>
            <p className="text-xs text-gray-500 flex items-center justify-center md:justify-start gap-1">
              Fatto con <Heart className="w-3 h-3 text-red-500 fill-red-500" /> da Alessio Saulli
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <motion.a
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              href="https://instagram.com/saullialessioo"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-50 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-colors"
              title="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              href="https://www.linkedin.com/in/alessio-saulli-07b189399/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              href="mailto:alessiosaulli00@gmail.com"
              className="p-2 bg-gray-50 text-gray-500 hover:text-nimbus-600 hover:bg-nimbus-50 rounded-xl transition-colors"
              title="Email"
            >
              <Mail className="w-5 h-5" />
            </motion.a>
          </div>
          
        </div>
      </div>
    </footer>
  )
}
