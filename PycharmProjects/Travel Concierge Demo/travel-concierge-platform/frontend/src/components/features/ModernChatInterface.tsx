'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Bot, User, Settings, ThumbsUp, ThumbsDown, Star, Heart, Brain, AlertCircle, X, Sparkles, MapPin, Calendar, Plane } from 'lucide-react'

interface Message {
  id: string
  content: string
  type: 'user' | 'ai'
  timestamp: Date
  agent_used?: string
  confidence?: number
  personalization_score?: number
  suggestions?: string[]
  booking_options?: BookingOption[]
  user_insights?: any
}

interface BookingOption {
  type: string
  option: string
  price: string
  details: string
  availability: string
  personalization?: string
}

interface UserProfile {
  user_id: string
  name?: string
  age_group?: string
  personality_type?: string
  communication_style?: string
  budget_range?: string
  interests?: string[]
  preferred_language?: string
  voice_enabled?: boolean
}

const PERSONALITY_TYPES = [
  { value: 'adventurous', label: '🏔️ Adventurous', desc: 'Love thrills and outdoor activities' },
  { value: 'luxury', label: '💎 Luxury', desc: 'Prefer premium experiences' },
  { value: 'budget', label: '💰 Budget', desc: 'Value-conscious traveler' },
  { value: 'cultural', label: '🏛️ Cultural', desc: 'Interested in history and art' },
  { value: 'relaxed', label: '🧘 Relaxed', desc: 'Prefer peaceful experiences' },
  { value: 'family', label: '👨‍👩‍👧‍👦 Family', desc: 'Traveling with family' },
  { value: 'business', label: '💼 Business', desc: 'Efficient and time-conscious' },
  { value: 'foodie', label: '🍜 Foodie', desc: 'Passionate about cuisine' },
  { value: 'photographer', label: '📸 Photographer', desc: 'Seeking perfect shots' },
  { value: 'wellness', label: '🧘‍♀️ Wellness', desc: 'Focus on health and wellbeing' },
  { value: 'backpacker', label: '🎒 Backpacker', desc: 'Independent budget travel' },
  { value: 'romantic', label: '💕 Romantic', desc: 'Couple travel and romance' }
]

const COMMUNICATION_STYLES = [
  { value: 'friendly', label: 'Friendly', desc: 'Warm and helpful' },
  { value: 'professional', label: 'Professional', desc: 'Business-like and efficient' },
  { value: 'casual', label: 'Casual', desc: 'Relaxed and conversational' },
  { value: 'enthusiastic', label: 'Enthusiastic', desc: 'Energetic and exciting' },
  { value: 'formal', label: 'Formal', desc: 'Polite and detailed' },
  { value: 'humorous', label: 'Humorous', desc: 'Light-hearted and witty' },
  { value: 'detailed', label: 'Detailed', desc: 'Comprehensive information' },
  { value: 'concise', label: 'Concise', desc: 'Brief and to the point' }
]

export function ModernChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [userId] = useState(() => `user_${Date.now()}`)
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    user_id: userId,
    personality_type: 'adventurous',
    communication_style: 'friendly',
    budget_range: 'mid-range',
    interests: ['adventure'],
    preferred_language: 'en-US',
    voice_enabled: false
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      content: `Welcome to your personalized AI travel companion! I'm here to help you discover amazing destinations and plan unforgettable journeys.

I learn from every conversation to provide you with unique, tailored recommendations. Let's start planning your next adventure!`,
      type: 'ai',
      timestamp: new Date(),
      agent_used: 'Personalized AI',
      confidence: 1.0,
      personalization_score: 0.1,
      suggestions: [
        "Plan a weekend getaway",
        "Find luxury resorts in Kerala",
        "Adventure activities in Himachal",
        "Budget trip to Rajasthan"
      ]
    }
    setMessages([welcomeMessage])
  }, [])

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      type: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/personalized-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          session_id: sessionId,
          user_id: userId,
          context: {},
          voice_input: false,
          preferred_language: userProfile.preferred_language || 'en-US'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        type: 'ai',
        timestamp: new Date(),
        agent_used: data.agent_used,
        confidence: data.confidence,
        personalization_score: data.personalization_score,
        suggestions: data.suggestions,
        booking_options: data.booking_options,
        user_insights: data.user_insights
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I'm having trouble connecting right now, but I can still help! Based on your message about "${messageContent}", here are some quick suggestions:

🌟 **Popular Destinations**: Goa, Kerala, Rajasthan, Himachal Pradesh
⏰ **Best Time**: October to March for most destinations  
💰 **Budget Tips**: ₹3,000-15,000 per day depending on comfort level

I'll be back to full personalized mode once the connection is restored!`,
        type: 'ai',
        timestamp: new Date(),
        agent_used: 'Offline Assistant',
        confidence: 0.6,
        suggestions: [
          "Tell me about Goa",
          "Plan a Kerala trip",
          "Budget travel tips",
          "Luxury destinations"
        ]
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = () => {
    sendMessage(input)
    setInput('')
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const response = await fetch('http://localhost:8000/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...updates
        })
      })

      if (response.ok) {
        const data = await response.json()
        setUserProfile(prev => ({ ...prev, ...updates }))
        
        const systemMessage: Message = {
          id: Date.now().toString(),
          content: `✨ Profile updated! Your personalization score is now ${(data.personalization_score * 100).toFixed(0)}%. I'll adapt my responses to match your preferences.`,
          type: 'ai',
          timestamp: new Date(),
          agent_used: 'Profile Manager',
          confidence: 1.0,
          personalization_score: data.personalization_score
        }
        setMessages(prev => [...prev, systemMessage])
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const submitFeedback = async (messageId: string, feedbackType: string, feedbackData: any) => {
    try {
      await fetch('http://localhost:8000/api/user-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          feedback_type: feedbackType,
          feedback_data: feedbackData,
          response_id: messageId
        })
      })
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const handleThumbsUp = (messageId: string) => {
    submitFeedback(messageId, 'thumbs', { thumbs: 'up' })
  }

  const handleThumbsDown = (messageId: string) => {
    submitFeedback(messageId, 'thumbs', { thumbs: 'down' })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Personalized AI Travel Concierge</h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Learning your preferences</span>
                    <span>•</span>
                    <span className="font-medium">
                      {PERSONALITY_TYPES.find(p => p.value === userProfile.personality_type)?.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Customize</span>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-3 max-w-4xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  {message.type === 'user' ? 
                    <User className="w-5 h-5 text-white" /> : 
                    <Sparkles className="w-5 h-5 text-white" />
                  }
                </div>

                {/* Message Content */}
                <div className="flex-1 space-y-2">
                  <div className={`rounded-2xl px-6 py-4 shadow-sm ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-12' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>

                  {/* AI Message Metadata */}
                  {message.type === 'ai' && (
                    <div className="ml-4 space-y-3">
                      {/* Agent Info */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 text-gray-500">
                          <Brain className="w-3 h-3" />
                          <span>{message.agent_used}</span>
                        </div>
                        {message.personalization_score && (
                          <div className="flex items-center space-x-1 bg-pink-50 px-2 py-1 rounded-full">
                            <Heart className="w-3 h-3 text-pink-500" />
                            <span className="text-pink-600 font-medium">
                              {(message.personalization_score * 100).toFixed(0)}% personalized
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-600 flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Try these suggestions:</span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {message.suggestions.slice(0, 4).map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => sendMessage(suggestion)}
                                className="inline-flex items-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors duration-200 border border-blue-200"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Booking Options */}
                      {message.booking_options && message.booking_options.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-600 flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>Personalized recommendations:</span>
                          </p>
                          <div className="grid gap-3">
                            {message.booking_options.slice(0, 2).map((option, idx) => (
                              <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    {option.type === 'flight' && <Plane className="w-4 h-4 text-green-600" />}
                                    {option.type === 'hotel' && <MapPin className="w-4 h-4 text-green-600" />}
                                    {option.type === 'activity' && <Calendar className="w-4 h-4 text-green-600" />}
                                    <span className="font-medium text-green-800 text-sm">{option.option}</span>
                                  </div>
                                  <span className="font-bold text-green-700 text-sm">{option.price}</span>
                                </div>
                                <p className="text-green-600 text-xs mb-1">{option.details}</p>
                                <p className="text-green-500 text-xs italic">✨ {option.personalization}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Feedback Buttons */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleThumbsUp(message.id)}
                          className="flex items-center space-x-1 px-3 py-1 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Helpful</span>
                        </button>
                        <button
                          onClick={() => handleThumbsDown(message.id)}
                          className="flex items-center space-x-1 px-3 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>Not helpful</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-600">Crafting your personalized response...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me about your dream destination..."
                className="w-full bg-gray-50 border border-gray-300 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-2xl p-4 transition-all duration-200 shadow-lg disabled:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 text-center text-xs text-gray-500">
            💡 Try: "Plan a luxury trip to Kerala" or "Adventure activities in Himachal"
          </div>
        </div>
      </div>

      {/* Profile Sidebar */}
      {showProfile && (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Profile</h3>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={userProfile.name || ''}
                onChange={(e) => updateProfile({ name: e.target.value })}
                placeholder="Enter your name"
                className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Travel Personality</label>
              <div className="space-y-2">
                {PERSONALITY_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => updateProfile({ personality_type: type.value })}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                      userProfile.personality_type === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Communication Style</label>
              <div className="grid gap-2">
                {COMMUNICATION_STYLES.map(style => (
                  <button
                    key={style.value}
                    onClick={() => updateProfile({ communication_style: style.value })}
                    className={`text-left p-3 rounded-lg border transition-all duration-200 ${
                      userProfile.communication_style === style.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-gray-500">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Budget Range</label>
              <div className="space-y-2">
                {[
                  { value: 'budget', label: '💰 Budget', desc: 'Value-conscious traveler' },
                  { value: 'mid-range', label: '🏨 Mid-range', desc: 'Balanced comfort and value' },
                  { value: 'luxury', label: '💎 Luxury', desc: 'Premium experiences' }
                ].map(budget => (
                  <button
                    key={budget.value}
                    onClick={() => updateProfile({ budget_range: budget.value })}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                      userProfile.budget_range === budget.value
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{budget.label}</div>
                    <div className="text-xs text-gray-500">{budget.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}