import { motion } from 'framer-motion'
import { Cloud } from 'lucide-react'

interface SplashScreenProps {
  onComplete?: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #15803d 0%, #22c55e 45%, #4ade80 100%)' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => onComplete?.()}
    >
      <div className="absolute inset-0 bg-dots opacity-20" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center text-center px-8"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-8"
        >
          <img
            src="/logo.png"
            alt="NimbusCloud Logo"
            className="w-28 h-28 object-contain drop-shadow-2xl brightness-0 invert"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3"
        >
          NimbusCloud
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-white/80 text-lg font-light tracking-wide max-w-sm"
        >
          Il tuo spazio, sempre con te
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-white/50 text-sm mt-6 font-light italic"
        >
          Sicuro · Elegante · Personale
        </motion.p>

        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 48 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="h-0.5 bg-white/40 rounded-full mt-10"
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ delay: 1.2, duration: 1.5, repeat: Infinity }}
          className="mt-8 flex gap-1.5"
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70" />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
