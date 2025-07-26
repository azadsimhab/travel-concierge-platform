"use client"

import { useState, FormEvent, useEffect, useImperativeHandle, forwardRef } from "react"
import { Send, Bot, Paperclip, Mic, CornerDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat"
import { ChatMessageList } from "@/components/ui/chat-message-list"

interface ExpandableChatDemoProps {
  onRef?: (ref: { openChat: () => void }) => void
  initialMessage?: string
}

export function ExpandableChatDemo({ onRef, initialMessage }: ExpandableChatDemoProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Hello! I'm your AI Travel Concierge. How can I help you plan your next adventure?",
      sender: "ai",
    },
    {
      id: 2,
      content: "I'm looking for a romantic getaway in Europe for next month.",
      sender: "user",
    },
    {
      id: 3,
      content: "Perfect! I'd love to help you plan a romantic European getaway. Here are some enchanting destinations I recommend:\n\n🇮🇹 **Tuscany, Italy** - Rolling hills, wine tastings, and charming villages\n🇫🇷 **Provence, France** - Lavender fields and cozy countryside retreats\n🇬🇷 **Santorini, Greece** - Stunning sunsets and luxury cliff-side hotels\n\nWhat type of activities interest you most? Cultural experiences, culinary adventures, or relaxation?",
      sender: "ai",
    },
  ])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Handle initial message from search bar
  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setInput(initialMessage)
    }
  }, [initialMessage])

  // Debug ref setup
  useEffect(() => {
    console.log('ExpandableChatDemo: onRef provided:', !!onRef)
  }, [onRef])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = {
      id: messages.length + 1,
      content: input,
      sender: "user",
    }
    
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Send message to backend
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          session_id: 'demo-session',
          user_id: 'demo-user-' + Date.now(),
          context: {},
          voice_input: false,
          preferred_language: 'en-US'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            content: data.response,
            sender: "ai",
          },
        ])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      // Fallback response
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          content: "I apologize, but I'm having trouble connecting to my services right now. Please try again in a moment!",
          sender: "ai",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAttachFile = () => {
    // Placeholder for file attachment
    console.log("File attachment clicked")
  }

  const handleMicrophoneClick = () => {
    // Placeholder for voice input
    console.log("Microphone clicked")
  }

  return (
    <ExpandableChat
      size="lg"
      position="bottom-right"
      icon={<Bot className="h-6 w-6" />}
      onRef={onRef}
    >
      <ExpandableChatHeader className="flex-col text-center justify-center">
        <h1 className="text-xl font-semibold">AI Travel Concierge ✈️</h1>
        <p className="text-sm text-muted-foreground">
          Your personal travel planning assistant
        </p>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <ChatMessageList>
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.sender === "user" ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                src={
                  message.sender === "user"
                    ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop"
                    : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                }
                fallback={message.sender === "user" ? "You" : "AI"}
              />
              <ChatBubbleMessage
                variant={message.sender === "user" ? "sent" : "received"}
              >
                {message.content}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {isLoading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                fallback="AI"
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter>
        <form
          onSubmit={handleSubmit}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about destinations, flights, hotels, or activities..."
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center p-3 pt-0 justify-between">
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleAttachFile}
              >
                <Paperclip className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleMicrophoneClick}
              >
                <Mic className="size-4" />
              </Button>
            </div>
            <Button type="submit" size="sm" className="ml-auto gap-1.5" disabled={isLoading}>
              Send Message
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  )
}