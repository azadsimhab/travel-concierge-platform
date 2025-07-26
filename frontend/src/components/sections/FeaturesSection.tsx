'use client'

import { motion } from 'framer-motion'
import { Brain, Camera, Globe, Sparkles, Zap, Shield } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Planning',
    description: 'Intelligent travel recommendations based on your preferences, budget, and style.',
    color: 'from-neon-cyan to-neon-purple'
  },
  {
    icon: Camera,
    title: 'Visual Search',
    description: 'Upload photos to find similar destinations and get personalized recommendations.',
    color: 'from-neon-purple to-neon-gold'
  },
  {
    icon: Globe,
    title: 'Global Coverage',
    description: 'Access to thousands of destinations worldwide with real-time availability.',
    color: 'from-neon-gold to-neon-emerald'
  },
  {
    icon: Sparkles,
    title: 'Personalized Experience',
    description: 'Learn your preferences and create increasingly tailored travel suggestions.',
    color: 'from-neon-emerald to-neon-cyan'
  },
  {
    icon: Zap,
    title: 'Instant Booking',
    description: 'Book flights, hotels, and activities directly through our platform.',
    color: 'from-neon-cyan to-neon-purple'
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Bank-level security with 24/7 support for worry-free travel planning.',
    color: 'from-neon-purple to-neon-gold'
  }
]

export function FeaturesSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Why Choose Our
            <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent"> AI Platform</span>
          </h2>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            Experience the future of travel planning with cutting-edge AI technology
            that understands your desires and creates perfect journeys.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group"
            >
              <div className="bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-6 h-full hover:border-neon-cyan/50 transition-all duration-300">
                {/* Icon */}
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-cosmic-950" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 