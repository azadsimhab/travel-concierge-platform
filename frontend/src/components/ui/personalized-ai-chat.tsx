"use client"

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PersonalizedChatProps {
  className?: string
  userId: string
  onClose?: () => void
}

interface UserProfile {
  name?: string
  age_group?: string
  personality_type?: string
  communication_style?: string
  budget_range?: string
  interests?: string[]
  voice_enabled?: boolean
}

interface ChatMessage {
  type: 'user' | 'ai'
  content: string
  agent?: string
  suggestions?: string[]
  bookingOptions?: any[]
  personalizationScore?: number
  voiceAudioData?: string
  timestamp: string
}

export function PersonalizedAIChat({ className, userId, onClose }: PersonalizedChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [personalizationScore, setPersonalizationScore] = useState(0)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceLanguage, setVoiceLanguage] = useState('en-US')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Load user stats when component mounts
    loadUserStats()
  }, [userId])

  const loadUserStats = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/user-stats/${userId}`)
      if (response.ok) {
        const stats = await response.json()
        setPersonalizationScore(stats.profile_completeness || 0)
        setIsVoiceEnabled(stats.voice_enabled || false)
      }
    } catch (error) {
      console.error('Failed to load user stats:', error)
    }
  }

  const sendMessage = async (message: string, isVoiceInput: boolean = false) => {
    if (!message.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      const response = await fetch('http://localhost:8000/api/personalized-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: `personalized_${Date.now()}`,
          user_id: userId,
          voice_input: isVoiceInput,
          preferred_language: voiceLanguage
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const aiMessage: ChatMessage = {
        type: 'ai',
        content: data.response,
        agent: data.agent_used,
        suggestions: data.suggestions,
        bookingOptions: data.booking_options,
        personalizationScore: data.personalization_score,
        voiceAudioData: data.voice_audio_data,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, aiMessage])
      setPersonalizationScore(data.personalization_score)

      // Play voice response if available
      if (data.voice_audio_data && isVoiceEnabled) {
        playVoiceResponse(data.voice_audio_data)
      }

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        type: 'ai',
        content: 'Sorry, I experienced a connection issue. Please try again.',
        agent: 'System',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioBase64 = await blobToBase64(audioBlob)
        
        // Send voice message
        await sendVoiceMessage(audioBase64)
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Voice recording error:', error)
      alert('Voice recording not available. Please check microphone permissions.')
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendVoiceMessage = async (audioData: string) => {
    setIsTyping(true)
    
    try {
      const response = await fetch('http://localhost:8000/api/voice-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_data: audioData.split(',')[1], // Remove data:audio/wav;base64, prefix
          session_id: `voice_${Date.now()}`,
          user_id: userId,
          language: voiceLanguage
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      // Add user message (transcribed)
      const userMessage: ChatMessage = {
        type: 'user',
        content: `🎤 ${data.text_input}`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, userMessage])

      // Add AI response
      const aiMessage: ChatMessage = {
        type: 'ai',
        content: data.text_response,
        agent: 'Personalized Voice AI',
        suggestions: data.suggestions,
        bookingOptions: data.booking_options,
        personalizationScore: data.personalization_score,
        voiceAudioData: data.voice_audio_data,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMessage])

      // Play voice response
      if (data.voice_audio_data) {
        playVoiceResponse(data.voice_audio_data)
      }

      setPersonalizationScore(data.personalization_score)

    } catch (error) {
      console.error('Voice chat error:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const playVoiceResponse = (audioData: string) => {
    try {
      const audio = new Audio(`data:audio/mp3;base64,${audioData}`)
      audio.play().catch(error => {
        console.error('Audio playback error:', error)
      })
    } catch (error) {
      console.error('Audio setup error:', error)
    }
  }

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
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
        setPersonalizationScore(data.personalization_score)
        setUserProfile(prev => ({ ...prev, ...updates }))
      }
    } catch (error) {
      console.error('Profile update error:', error)
    }
  }

  return (
    <div className={cn("fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", className)}>
      <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 max-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              🤖
            </div>
            <div>
              <h2 className="text-xl font-bold">Personalized AI Travel Assistant</h2>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <span>Personalization: {Math.round(personalizationScore * 100)}%</span>
                <div className="w-16 h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${personalizationScore * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={cn(
                "p-2 rounded-full transition-colors",
                isVoiceEnabled ? "bg-green-500" : "bg-white bg-opacity-20"
              )}
              title={isVoiceEnabled ? "Voice enabled" : "Voice disabled"}
            >
              🎤
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-xl font-semibold mb-2">Welcome to Your Personalized AI Assistant!</h3>
              <p className="mb-4">I learn from every conversation to provide you with unique travel experiences.</p>
              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <p><strong>Try saying:</strong></p>
                <ul className="text-left mt-2 space-y-1">
                  <li>• "I want to plan a luxury trip to Dubai"</li>
                  <li>• "Find me budget-friendly adventure activities"</li>
                  <li>• "I love cultural experiences and local food"</li>
                </ul>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={cn(
              "flex",
              message.type === 'user' ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-3/4 rounded-lg p-4",
                message.type === 'user' 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-100 text-gray-900"
              )}>
                {message.type === 'ai' && message.agent && (
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-blue-600">
                    <span>🧠</span>
                    <span>{message.agent}</span>
                    {message.personalizationScore && (
                      <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                        {Math.round(message.personalizationScore * 100)}% personalized
                      </span>
                    )}
                  </div>
                )}
                
                <div className="whitespace-pre-wrap">{message.content}</div>

                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(suggestion)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {message.bookingOptions && message.bookingOptions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm font-semibold">Personalized Recommendations:</div>
                    {message.bookingOptions.map((option, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-green-700">{option.type}</div>
                            <div className="font-medium">{option.option}</div>
                            <div className="text-sm text-gray-600">{option.details}</div>
                            {option.personalization && (
                              <div className="text-xs text-blue-600 mt-1">
                                ✨ {option.personalization}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">{option.price}</div>
                            <div className="text-xs text-gray-500">{option.availability}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {message.voiceAudioData && isVoiceEnabled && (
                  <button
                    onClick={() => playVoiceResponse(message.voiceAudioData!)}
                    className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    🔊 Play voice response
                  </button>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4 max-w-xs">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
              placeholder="Ask me anything about travel... I learn from every conversation!"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            />
            
            {isVoiceEnabled && (
              <button
                onMouseDown={startVoiceRecording}
                onMouseUp={stopVoiceRecording}
                onMouseLeave={stopVoiceRecording}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  isRecording 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "bg-green-500 text-white hover:bg-green-600"
                )}
                title="Hold to record voice message"
              >
                {isRecording ? "🔴 Recording..." : "🎤"}
              </button>
            )}
            
            <button
              onClick={() => sendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
          
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>💡 The more we chat, the better I understand your preferences!</span>
            <span>Powered by Gemini AI</span>
          </div>
        </div>
      </div>
    </div>
  )
}