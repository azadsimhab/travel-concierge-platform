'use client'

import { useState } from 'react'
import { Send, Loader2, Bot, User, X } from 'lucide-react'

interface Message {
  id: string
  content: string
  type: 'user' | 'ai'
  timestamp: Date
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Hi! I'm your AI travel assistant. I can help you with:\n\n✈️ Flight bookings and prices\n🏨 Hotel recommendations\n🗺️ Trip planning and itineraries\n🌍 Destination information\n\nWhat would you like to explore today?",
      type: 'ai',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    if (input.includes('hyderabad') && input.includes('vizianagaram')) {
      return `🚗 **Vizianagaram to Hyderabad Travel Options:**

**✈️ By Flight:**
• Visakhapatnam Airport (120km) → Hyderabad
• Airlines: IndiGo, SpiceJet, Air India
• Duration: 1.5 hours + 2 hours travel
• Price: ₹4,000-8,000

**🚂 By Train:**
• Vizianagaram Junction → Hyderabad
• Trains: East Coast Express, Konark Express
• Duration: 10-12 hours
• Price: ₹400-1,500

**🚌 By Bus:**
• APSRTC buses available
• Duration: 8-10 hours  
• Price: ₹500-1,200

Would you like me to check specific dates or help with bookings?`
    }
    
    if (input.includes('goa')) {
      return `🏖️ **Goa Travel Information:**

**Best Time to Visit:** October to March
**How to Reach:**
• ✈️ Goa Airport (Dabolim) - Direct flights from major cities
• 🚂 Madgaon/Thivim Railway Station
• 🚌 State buses from Mumbai, Bangalore

**Top Attractions:**
• Baga & Calangute Beaches
• Old Goa Churches
• Dudhsagar Waterfalls
• Anjuna Flea Market

**Budget:** ₹2,000-5,000 per day
Need specific recommendations for hotels or activities?`
    }
    
    if (input.includes('kerala')) {
      return `🌴 **Kerala - God's Own Country:**

**Must-Visit Places:**
• 🚤 Alleppey Backwaters
• 🏔️ Munnar Hill Station  
• 🌊 Kovalam Beach
• 🐘 Thekkady Wildlife Sanctuary

**Best Time:** September to March
**Specialties:**
• Houseboat cruises
• Ayurvedic treatments
• Spice plantations
• Traditional Kathakali shows

**Average Cost:** ₹3,000-6,000 per day
Which part of Kerala interests you most?`
    }
    
    if (input.includes('flight') || input.includes('book')) {
      return `✈️ **Flight Booking Assistance:**

I can help you find:
• Best prices and timing
• Direct vs connecting flights
• Seat selection tips
• Baggage policies

**Popular Routes:**
• Delhi ↔ Mumbai: ₹3,000-8,000
• Bangalore ↔ Hyderabad: ₹2,500-6,000
• Chennai ↔ Kolkata: ₹3,500-7,500

**Money-saving tips:**
• Book 2-3 months in advance
• Tuesday/Wednesday flights are cheaper
• Early morning flights cost less

Tell me your route and dates for specific options!`
    }
    
    if (input.includes('hotel')) {
      return `🏨 **Hotel Recommendations:**

**Budget Categories:**
• ₹1,000-2,000: Budget hotels
• ₹2,000-4,000: 3-star comfort
• ₹4,000-8,000: 4-star luxury
• ₹8,000+: 5-star premium

**Booking Tips:**
• Compare prices on multiple platforms
• Read recent reviews
• Check cancellation policies
• Book directly for best rates

**What I need to help:**
• City/destination
• Check-in dates
• Number of guests
• Budget range

Which destination are you looking for?`
    }
    
    return `I'd love to help you plan your perfect trip! 🌟

Could you tell me:
📍 **Where** are you planning to go?
📅 **When** are you traveling?
🎯 **What** interests you most? (beaches, mountains, culture, food)
💰 **Budget** range you're comfortable with?

Popular queries I can help with:
• "Plan a trip to Goa in December"
• "Find flights from Delhi to Bangalore"
• "Best hotels in Hyderabad under ₹3000"
• "Things to do in Kerala"

What would you like to explore? ✈️`
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      type: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    
    const currentInput = input
    setInput('')
    setIsLoading(true)

    setTimeout(() => {
      const aiResponse = generateResponse(currentInput)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        type: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Travel Assistant</h3>
            <p className="text-sm text-gray-500">Online • Ready to help</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                {message.type === 'user' ? 
                  <User className="w-5 h-5 text-white" /> : 
                  <Bot className="w-5 h-5 text-white" />
                }
              </div>
              <div className={`rounded-lg p-3 ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me about destinations, flights, hotels..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg p-2 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
} 