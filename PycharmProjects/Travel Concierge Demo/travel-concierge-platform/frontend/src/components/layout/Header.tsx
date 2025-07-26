"use client"

import type React from "react"
import { useState } from "react"
import { Search, Bell, MapPin, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  onMenuClick: () => void
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [notificationCount] = useState(3)

  return (
    <header className="glass-card border-b border-white/20 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button - Always Visible with proper z-index */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="relative z-50 rounded-xl p-2 hover:bg-white/80 hover:shadow-lg transition-all duration-200 group border border-gray-300/60 bg-white/90 backdrop-blur-sm shadow-sm"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors duration-200" />
        </Button>

        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Travel Hub</h1>
        </div>
      </div>

      {/* Search Bar - Responsive */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search destinations, hotels, activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-card border-white/30 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Mobile Search */}
        <Button variant="ghost" size="sm" className="md:hidden rounded-full w-9 h-9 p-0">
          <Search className="w-4 h-4" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative rounded-full w-9 h-9 p-0 hover:bg-white/60 transition-all duration-200"
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0 animate-pulse"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>

        {/* User Avatar */}
        <div className="relative group">
          <Avatar className="cursor-pointer ring-2 ring-transparent group-hover:ring-blue-200 transition-all duration-200 w-9 h-9">
            <AvatarImage src="/placeholder.svg?height=36&width=36" alt="User Avatar" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>

          {/* Online Status Indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
      </div>
    </header>
  )
}