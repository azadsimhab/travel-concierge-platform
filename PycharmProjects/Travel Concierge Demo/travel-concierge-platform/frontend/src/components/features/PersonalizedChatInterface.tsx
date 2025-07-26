'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, Bot, User, Settings, ThumbsUp, ThumbsDown, Star, Heart, Brain, AlertCircle } from 'lucide-react'

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

export function PersonalizedChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [userId] = useState(() => `user_${Date.now()}`)
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    user_id: userId,
    personality_type: 'adventurous',
    communication_style: 'friendly',
    budget_range: 'mid-range',
    interests: ['adventure'],
    preferred_language: 'en-US',
    voice_enabled: false
  })

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      content: `🌟 **Welcome to Your Personalized AI Travel Concierge!**

I'm your intelligent travel companion powered by advanced AI. I learn from every conversation to provide you unique, tailored experiences.

**What makes me special:**
🧠 I learn your preferences and adapt my recommendations
🎯 Personalized suggestions based on your travel personality  
🌍 Destination-specific intelligence and local insights
💫 Every response is crafted uniquely for you

**Current Profile:**
• Personality: ${PERSONALITY_TYPES.find(p => p.value === userProfile.personality_type)?.label}
• Style: ${COMMUNICATION_STYLES.find(s => s.value === userProfile.communication_style)?.label}
• Budget: ${userProfile.budget_range}

Click the settings icon to customize your profile, or just start chatting about your dream destination! ✈️`,
      type: 'ai',
      timestamp: new Date(),
      agent_used: 'Personalized Welcome System',
      confidence: 1.0,
      personalization_score: 0.1
    }
    setMessages([welcomeMessage])
  }, [userProfile.personality_type, userProfile.communication_style, userProfile.budget_range])

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
      console.log('Sending message to personalized chat API:', messageContent)
      
      const requestData = {
        message: messageContent,
        session_id: sessionId,
        user_id: userId,
        context: {},
        voice_input: false,
        preferred_language: userProfile.preferred_language || 'en-US'
      }
      
      console.log('Request data:', requestData)
      
      const response = await fetch('http://localhost:8000/api/personalized-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Response data:', data)
      
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
      
      // Provide a helpful response even when backend is down
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `🔧 **Connection Issue Detected**

I'm having trouble connecting to the personalized AI backend. Here's what I can help with:

**For your query: "${messageContent}"**

Based on your message, I can see you're interested in travel planning. While I wait for the connection to restore, here are some quick suggestions:

• **Popular Destinations**: Goa, Kerala, Rajasthan are trending
• **Best Time to Travel**: October to March for most destinations  
• **Budget Planning**: ₹3,000-15,000 per day depending on luxury level

**Troubleshooting:**
- Check if backend server is running: http://localhost:8000
- Refresh the page and try again
- Contact support if the issue persists

I'll be back to full personalized mode once the connection is restored! 🚀`,
        type: 'ai',
        timestamp: new Date(),
        agent_used: 'Offline Assistant',
        confidence: 0.6,
        suggestions: [
          "Tell me about popular destinations",
          "What's the best time to travel?",
          "Help me plan a budget trip",
          "Refresh and try again"
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
        
        // Add a system message about profile update
        const systemMessage: Message = {
          id: Date.now().toString(),
          content: `✅ **Profile Updated Successfully!**

Your personalization score is now **${(data.personalization_score * 100).toFixed(0)}%**

I'll now adapt my responses to match your updated preferences. Try asking me something about travel to see the difference!`,
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

  const ProfilePanel = () => (
    <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 z-10 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Your Profile</h3>
          <button
            onClick={() => setShowProfile(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={userProfile.name || ''}
            onChange={(e) => updateProfile({ name: e.target.value })}
            placeholder="Enter your name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Personality Type</label>
          <select
            value={userProfile.personality_type}
            onChange={(e) => updateProfile({ personality_type: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            {PERSONALITY_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.desc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Communication Style</label>
          <select
            value={userProfile.communication_style}
            onChange={(e) => updateProfile({ communication_style: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            {COMMUNICATION_STYLES.map(style => (
              <option key={style.value} value={style.value}>
                {style.label} - {style.desc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
          <select
            value={userProfile.budget_range}
            onChange={(e) => updateProfile({ budget_range: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="budget">💰 Budget (Value-conscious)</option>
            <option value="mid-range">🏨 Mid-range (Balanced)</option>
            <option value="luxury">💎 Luxury (Premium)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
          <select
            value={userProfile.age_group || ''}
            onChange={(e) => updateProfile({ age_group: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="">Select age group</option>
            <option value="18-25">18-25 years</option>
            <option value="26-35">26-35 years</option>
            <option value="36-50">36-50 years</option>
            <option value="50+">50+ years</option>
          </select>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Personalized AI Travel Concierge</h3>
              <p className="text-sm text-blue-100">Learning your preferences • Personality: {PERSONALITY_TYPES.find(p => p.value === userProfile.personality_type)?.label}</p>
            </div>
          </div>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="text-white hover:text-blue-100 p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' ? 'bg-blue-600' : 'bg-gradient-to-r from-purple-600 to-blue-600'
              }`}>
                {message.type === 'user' ? 
                  <User className="w-5 h-5 text-white" /> : 
                  <Brain className="w-5 h-5 text-white" />
                }
              </div>
              <div className="space-y-2">
                <div className={`rounded-lg p-4 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-50 text-gray-900 border border-gray-200'
                }`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                  
                  {/* AI Message metadata */}
                  {message.type === 'ai' && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>🤖 {message.agent_used}</span>
                        {message.personalization_score && (
                          <span className="flex items-center space-x-1">
                            <Heart className="w-3 h-3 text-red-500" />
                            <span>{(message.personalization_score * 100).toFixed(0)}% personalized</span>
                          </span>
                        )}
                      </div>
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-600">💡 Suggestions for you:</p>
                          {message.suggestions.slice(0, 3).map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => sendMessage(suggestion)}
                              className="block w-full text-left text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded px-2 py-1 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Booking Options */}
                      {message.booking_options && message.booking_options.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-600">🎫 Personalized Options:</p>
                          {message.booking_options.slice(0, 2).map((option, idx) => (
                            <div key={idx} className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                              <div className="font-medium text-green-800">{option.option}</div>
                              <div className="text-green-600">{option.price} - {option.details}</div>
                              {option.personalization && (
                                <div className="text-green-500 mt-1">✨ {option.personalization}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Feedback buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleThumbsUp(message.id)}
                          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Helpful</span>
                        </button>
                        <button
                          onClick={() => handleThumbsDown(message.id)}
                          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
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
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Personalizing your response...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me about your dream destination..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg p-3 transition-all duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          💡 Try: "Plan a 5-day adventure trip to Goa" or "Find luxury hotels in Kerala"
        </div>
      </div>

      {/* Profile Panel */}
      {showProfile && <ProfilePanel />}
    </div>
  )
}