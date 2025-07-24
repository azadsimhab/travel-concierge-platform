"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiClient, utils } from "../lib/api";
import { Camera, Image, Send, Mic, Globe, Calendar, Plane, Hotel, Mountain, Sparkles, Users } from "lucide-react";

// Helper Components
const QuickAction = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    className="flex flex-col items-center justify-center gap-2 bg-white/80 hover:bg-blue-50 rounded-xl shadow p-4 transition-all border border-blue-100 min-w-[120px] min-h-[90px]"
    onClick={onClick}
    aria-label={label}
  >
    <span className="text-blue-500 text-2xl">{icon}</span>
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </button>
);

const MessageBubble = ({ sender, text, time, agent, confidence, suggestions }: any) => (
  <div className={`flex ${sender === "user" ? "justify-end" : "justify-start"} mb-2`}>
    <div className={`max-w-[80%] rounded-2xl p-4 shadow bg-white/80 border ${sender === "user" ? "ml-auto bg-blue-100 border-blue-200" : "bg-white border-gray-200"}`}>
      {agent && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-600">{agent}</span>
          {confidence !== undefined && (
            <span className="text-xs text-gray-400">Confidence: {(confidence * 100).toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className="text-gray-800 whitespace-pre-line">{text}</div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {suggestions.map((s: string, i: number) => (
            <span key={i} className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs cursor-pointer hover:bg-blue-100">{s}</span>
          ))}
        </div>
      )}
      <div className="text-xs text-gray-400 mt-1 text-right">{time}</div>
    </div>
  </div>
);

const ImagePreview = ({ src, onRemove }: { src: string; onRemove: () => void }) => (
  <div className="relative inline-block mr-2">
    <img src={src} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
    <button
      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
      onClick={onRemove}
      aria-label="Remove image"
    >
      ×
    </button>
  </div>
);

const LoadingDots = () => (
  <span className="inline-block animate-pulse text-blue-400">•••</span>
);

// Main App Component
const TravelConciergeApp = () => {
  const [messages, setMessages] = useState<any[]>([
    {
      sender: "system",
      text: `Welcome to your AI Travel Concierge! 🌍\n\nI'm here to help you plan the perfect trip. You can:\n• Chat with me about your travel dreams\n• Upload images for AI-powered destination suggestions\n• Explore popular destinations\n• Get personalized recommendations\n\nHow can I help you today?`,
      time: utils.formatTimestamp(new Date().toISOString()),
      agent: "System Agent",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(() => utils.generateSessionId());
  const [image, setImage] = useState<string | null>(null);
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [popularDestinations, setPopularDestinations] = useState<any[]>([]);
  const [quickActionLoading, setQuickActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient.getPopularDestinations().then((res) => {
      setPopularDestinations(res.destinations || []);
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Chat send handler
  const sendMessage = async (msg: string) => {
    if (!msg.trim()) return;
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: msg, time: utils.formatTimestamp(new Date().toISOString()) },
    ]);
    setInput("");
    setLoading(true);
    try {
      const res = await apiClient.chat(msg, sessionId);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.response,
          time: utils.formatTimestamp(new Date().toISOString()),
          agent: res.agent_used,
          confidence: res.confidence,
          suggestions: res.suggestions,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, something went wrong. Please try again.", time: utils.formatTimestamp(new Date().toISOString()), agent: "System" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Image search handler
  const handleImageSearch = async () => {
    if (!image) return;
    setImageModalOpen(false);
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: "[Image uploaded]", time: utils.formatTimestamp(new Date().toISOString()) },
    ]);
    try {
      const res = await apiClient.imageSearch(image, sessionId, "destination");
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.success
            ? `AI identified: ${res.results.identified_objects.join(", ")}\n\nSuggested destinations:\n${res.results.suggested_destinations.map((d) => `• ${d.name} (${(d.similarity * 100).toFixed(1)}%): ${d.reason}`).join("\n")}`
            : "Sorry, I couldn't identify the destination from the image.",
          time: utils.formatTimestamp(new Date().toISOString()),
          agent: "Image Search AI",
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Image search failed. Please try again.", time: utils.formatTimestamp(new Date().toISOString()), agent: "System" },
      ]);
    } finally {
      setLoading(false);
      setImage(null);
    }
  };

  // Handle file input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await utils.fileToBase64(file);
      setImage(base64);
    }
  };

  // Drag and drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const base64 = await utils.fileToBase64(file);
      setImage(base64);
      setImageModalOpen(true);
    }
  };

  // Webcam capture (placeholder)
  const handleWebcamCapture = () => {
    alert("Webcam capture coming soon!");
  };

  // Quick actions
  const quickActions = [
    { icon: <Sparkles />, label: "Get Inspiration", action: () => handleQuickAction("I need travel inspiration") },
    { icon: <Calendar />, label: "Plan Trip", action: () => handleQuickAction("Plan my trip") },
    { icon: <Plane />, label: "Book Flights", action: () => handleQuickAction("Book a flight") },
    { icon: <Hotel />, label: "Find Hotels", action: () => handleQuickAction("Find a hotel") },
    { icon: <Mountain />, label: "Adventure Travel", action: () => handleQuickAction("Show me adventure activities") },
    { icon: <Globe />, label: "International", action: () => handleQuickAction("Show me international destinations") },
  ];

  async function handleQuickAction(msg: string) {
    setQuickActionLoading(true);
    await sendMessage(msg);
    setQuickActionLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center py-4 px-2">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between p-4 rounded-2xl bg-white/80 shadow mb-4 border border-blue-100">
        <div className="flex items-center gap-3">
          <img src="/icon-192.png" alt="AI Travel Concierge" className="w-10 h-10 rounded-lg" />
          <div>
            <h1 className="text-2xl font-bold text-blue-700">AI Travel Concierge</h1>
            <p className="text-xs text-gray-500">Your intelligent travel companion</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button className="p-2 rounded-full hover:bg-blue-100 transition" aria-label="Notifications"><span className="text-gray-400"><svg width="20" height="20" fill="none" stroke="currentColor"><path d="M10 2a6 6 0 0 1 6 6v2a6 6 0 0 0 1 3l1 2H2l1-2a6 6 0 0 0 1-3V8a6 6 0 0 1 6-6z" /></svg></span></button>
          <button className="p-2 rounded-full hover:bg-blue-100 transition" aria-label="Settings"><span className="text-gray-400"><svg width="20" height="20" fill="none" stroke="currentColor"><circle cx="10" cy="10" r="8" /><path d="M10 6v4l2 2" /></svg></span></button>
        </div>
      </header>

      {/* Popular Destinations */}
      <section className="w-full max-w-4xl mb-4" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
        <div className="bg-white/80 rounded-2xl shadow p-4 border border-blue-100 mb-2 flex items-center gap-2">
          <span className="text-blue-500"><Globe size={20} /></span>
          <span className="font-semibold text-lg">Popular Destinations</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {popularDestinations.length === 0 ? (
            <div className="text-gray-400 italic">Loading...</div>
          ) : (
            popularDestinations.map((dest, i) => (
              <div key={i} className="min-w-[200px] bg-white/90 rounded-xl shadow border border-blue-100 p-3 flex flex-col items-center mr-2">
                <img src={dest.image || "/icon-192.png"} alt={dest.name} className="w-28 h-20 object-cover rounded-lg mb-2" />
                <div className="font-semibold text-blue-700 text-center">{dest.name}</div>
                <div className="text-xs text-gray-500 text-center">{dest.country}</div>
                <div className="text-xs text-yellow-500 mt-1">★ {dest.rating}</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="w-full max-w-4xl mb-4">
        <div className="bg-white/80 rounded-2xl shadow p-4 border border-blue-100 mb-2 flex items-center gap-2">
          <span className="text-green-500"><Sparkles size={20} /></span>
          <span className="font-semibold text-lg">Quick Actions</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, i) => (
            <QuickAction key={i} icon={action.icon} label={action.label} onClick={action.action} />
          ))}
        </div>
      </section>

      {/* Chat & Image Search */}
      <section className="w-full max-w-4xl flex-1 flex flex-col bg-white/80 rounded-2xl shadow border border-blue-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-lg flex items-center gap-2"><span className="text-blue-500"><Image size={20} /></span>AI Travel Assistant</span>
          <div className="flex gap-2">
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setImageModalOpen(true)}
              aria-label="Image Search"
            >
              <Image size={20} /> Image Search
            </button>
            <button className="btn-secondary" aria-label="Voice Search" disabled><Mic size={20} /></button>
            <button className="btn-secondary" aria-label="Webcam" onClick={handleWebcamCapture}><Camera size={20} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto mb-2 px-1" style={{ minHeight: 200, maxHeight: 350 }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} {...msg} />
          ))}
          {isLoading && <div className="flex justify-start"><LoadingDots /></div>}
          <div ref={chatEndRef} />
        </div>
        <form
          className="flex items-center gap-2 mt-2"
          onSubmit={e => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <input
            className="input-field flex-1"
            type="text"
            placeholder='Ask me anything about travel... 🌍'
            value={input}
            onChange={e => setInput(e.target.value)}
            aria-label="Chat input"
            autoFocus
          />
          <button
            type="submit"
            className="btn-primary flex items-center gap-1"
            disabled={!input.trim() || isLoading}
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
          <span>💡 Try: "Plan a beach vacation" or upload an image</span>
          <span className="ml-auto flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full inline-block" /> AI Online</span>
        </div>
      </section>

      {/* Image Search Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
              onClick={() => setImageModalOpen(false)}
              aria-label="Close"
            >×</button>
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2"><Image size={20} /> Image Search</h2>
            <div
              className="border-2 border-dashed border-blue-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer mb-2 min-h-[120px]"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              {image ? (
                <ImagePreview src={image} onRemove={() => setImage(null)} />
              ) : (
                <span className="text-gray-400">Drag & drop an image here, or click to select</span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                className="btn-primary flex-1"
                onClick={handleImageSearch}
                disabled={!image || isLoading}
              >
                {isLoading ? <LoadingDots /> : <><Image size={18} /> Search</>}
              </button>
              <button
                className="btn-secondary flex-1"
                onClick={() => setImageModalOpen(false)}
              >Cancel</button>
            </div>
            <div className="text-xs text-gray-400 mt-2">Your image will be analyzed by AI for destination suggestions.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelConciergeApp; 