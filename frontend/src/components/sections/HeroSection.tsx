'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChatInterface } from '@/components/features/ChatInterface'
import { Sparkles, Globe, Zap } from 'lucide-react'

export function HeroSection() {
  const [showChat, setShowChat] = useState(false)

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2 text-neon-cyan"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">AI-Powered Travel Assistant</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-white via-neon-cyan to-neon-purple bg-clip-text text-transparent leading-tight"
            >
              Travel Beyond
              <br />
              Imagination
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-white/80 leading-relaxed"
            >
              Experience the future of travel with our AI concierge. From inspiration to booking,
              we handle everything while you dream of your next adventure.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowChat(true)}
              className="px-8 py-4 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg font-semibold text-cosmic-950 shadow-cosmic hover:shadow-neon transition-all duration-300"
            >
              Start Planning Now
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-glass-bg backdrop-blur-md border border-glass-border rounded-lg font-semibold text-white hover:bg-white/20 transition-all duration-300"
            >
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-6 pt-8"
          >
            {[
              { icon: Globe, label: 'Global Destinations', value: '1000+' },
              { icon: Zap, label: 'AI Responses', value: '<200ms' },
              { icon: Sparkles, label: 'Satisfaction Rate', value: '99.5%' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-neon-cyan" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Content - Chat Interface */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-[600px]"
        >
          <ChatInterface />
        </motion.div>
      </div>
    </section>
  )
} 