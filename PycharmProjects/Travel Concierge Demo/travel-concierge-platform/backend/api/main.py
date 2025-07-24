"""
AI Travel Concierge Platform - Updated Backend with Proper Agent System
Fixes the chat responses to use the correct agent routing
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import json
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv
import base64
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Travel Concierge Platform",
    description="Your intelligent travel companion powered by advanced AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3007", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---

class ChatRequest(BaseModel):
    message: str
    session_id: str
    context: Optional[Dict[str, Any]] = {}
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    agent_used: str
    confidence: float
    suggestions: List[str] = []
    booking_options: List[Dict[str, Any]] = []

class ImageSearchRequest(BaseModel):
    image_data: str
    session_id: str
    search_type: str = "destination"

class BookingRequest(BaseModel):
    booking_type: str
    details: Dict[str, Any]
    session_id: str
    user_id: str

# --- Advanced Agent System ---

class TravelAgentOrchestrator:
    def __init__(self):
        self.agents = {
            "inspiration": self.inspiration_agent,
            "place": self.place_agent,
            "poi": self.poi_agent,
            "planning": self.planning_agent,
            "booking": self.booking_agent,
            "trip_monitor": self.trip_monitor_agent,
            "day_of": self.day_of_agent
        }
        
    def detect_intent(self, message: str) -> str:
        """Detect user intent and route to appropriate agent"""
        message_lower = message.lower()
        
        # Place agent - location specific
        if any(location in message_lower for location in ["goa", "kerala", "rajasthan", "himachal", "kashmir", "delhi", "mumbai", "bangalore"]):
            return "place"
        
        # Planning agent - itinerary and scheduling
        elif any(word in message_lower for word in ["plan", "itinerary", "schedule", "trip", "vacation", "days", "week"]):
            return "planning"
        
        # Booking agent - reservations
        elif any(word in message_lower for word in ["book", "reserve", "flight", "hotel", "ticket", "accommodation"]):
            return "booking"
        
        # POI agent - attractions and activities
        elif any(word in message_lower for word in ["attraction", "visit", "see", "activity", "things to do", "sightseeing", "temple", "fort"]):
            return "poi"
        
        # Trip monitor - status and updates
        elif any(word in message_lower for word in ["status", "update", "weather", "delay", "cancel", "alert", "monitor"]):
            return "trip_monitor"
        
        # Day of agent - navigation and immediate help
        elif any(word in message_lower for word in ["navigate", "direction", "where", "help", "emergency", "now", "current"]):
            return "day_of"
        
        # Default to inspiration for general queries
        else:
            return "inspiration"
    
    def inspiration_agent(self, message: str) -> Dict[str, Any]:
        """Generate travel inspiration and ideas"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["beach", "ocean", "sea", "coastal"]):
            return {
                "response": "🏖️ Perfect! I found some incredible beach destinations that will make your heart skip a beat! India's coastline offers everything from vibrant party beaches to serene hidden coves.",
                "suggestions": ["Goa beach paradise", "Kerala backwaters cruise", "Andaman pristine islands", "Gokarna peaceful shores"],
                "confidence": 0.92
            }
        elif any(word in message_lower for word in ["mountain", "hill", "trek", "adventure"]):
            return {
                "response": "🏔️ Mountain adventures await! From the mighty Himalayas to the lush Western Ghats, India offers breathtaking experiences for every thrill-seeker.",
                "suggestions": ["Himachal Pradesh treks", "Kashmir valleys", "Uttarakhand peaks", "Hill station retreats"],
                "confidence": 0.90
            }
        elif any(word in message_lower for word in ["culture", "heritage", "history", "temple"]):
            return {
                "response": "🏛️ India's rich cultural tapestry awaits! Discover ancient temples, majestic palaces, and vibrant traditions spanning millennia.",
                "suggestions": ["Rajasthan royal heritage", "Tamil Nadu temple tours", "Delhi historical sites", "Varanasi spiritual journey"],
                "confidence": 0.88
            }
        else:
            return {
                "response": "🌟 Welcome to your AI Travel Concierge! I'm here to turn your travel dreams into reality. Whether you're seeking adventure, relaxation, or cultural immersion, I'll help you discover the perfect destination!",
                "suggestions": ["Beach paradise getaway", "Mountain adventure trek", "Cultural heritage tour", "Wildlife safari", "Luxury spa retreat", "Budget backpacking"],
                "confidence": 0.85
            }
    
    def place_agent(self, message: str) -> Dict[str, Any]:
        """Provide detailed location-specific information"""
        message_lower = message.lower()
        
        if "goa" in message_lower:
            return {
                "response": "🌴 Goa - India's crown jewel! This coastal paradise perfectly blends Portuguese heritage with Indian warmth. From the bustling beaches of North Goa to the serene shores of South Goa, every corner tells a story. The golden beaches, spice plantations, and vibrant nightlife create an unforgettable experience!",
                "suggestions": ["Best beaches in Goa", "Portuguese heritage sites", "Goa nightlife hotspots", "Spice plantation tours", "Water sports activities"],
                "confidence": 0.95
            }
        elif "kerala" in message_lower:
            return {
                "response": "🌿 Kerala - God's Own Country! This tropical paradise enchants with its emerald backwaters, misty hill stations, and pristine beaches. Experience the magic of houseboat cruises, Ayurvedic treatments, and tea plantations that stretch to the horizon.",
                "suggestions": ["Alleppey backwater cruises", "Munnar tea gardens", "Thekkady wildlife sanctuary", "Ayurvedic spa treatments", "Kerala cuisine experiences"],
                "confidence": 0.93
            }
        elif "rajasthan" in message_lower:
            return {
                "response": "🏰 Rajasthan - The Land of Kings! Step into a fairytale of majestic palaces, golden deserts, and colorful bazaars. This royal state offers camel safaris, palace stays, and cultural performances that transport you to an era of maharajas and legends.",
                "suggestions": ["Jaipur Pink City tour", "Udaipur City of Lakes", "Jaisalmer desert safari", "Jodhpur Blue City", "Rajasthani cultural shows"],
                "confidence": 0.94
            }
        else:
            return {
                "response": "🗺️ I have detailed insights about destinations worldwide! Tell me which place captivates your imagination, and I'll share insider knowledge, hidden gems, and the best times to visit.",
                "suggestions": ["Goa beach paradise", "Kerala backwaters", "Rajasthan heritage", "Himachal mountains", "Kashmir valleys"],
                "confidence": 0.80
            }
    
    def poi_agent(self, message: str) -> Dict[str, Any]:
        """Recommend attractions and activities"""
        return {
            "response": "🎯 Here are some incredible attractions that will make your trip unforgettable! Each destination offers unique experiences that showcase India's diverse beauty and rich heritage.",
            "suggestions": ["Taj Mahal - Symbol of eternal love", "Goa beaches - Coastal paradise", "Kerala backwaters - Serene waterways", "Rajasthan palaces - Royal grandeur"],
            "confidence": 0.88
        }
    
    def planning_agent(self, message: str) -> Dict[str, Any]:
        """Create detailed travel plans"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["3", "three", "weekend"]):
            return {
                "response": "📅 Perfect! I'll create an amazing 3-day weekend getaway that maximizes your time and experiences. This itinerary balances must-see attractions with relaxation and local culture immersion.",
                "suggestions": ["Day 1: Arrival & city exploration", "Day 2: Main attractions & activities", "Day 3: Relaxation & departure", "Customize itinerary"],
                "confidence": 0.92
            }
        elif any(word in message_lower for word in ["week", "7", "seven"]):
            return {
                "response": "🗓️ Excellent! A week-long adventure allows us to create a comprehensive journey covering multiple destinations, diverse experiences, and deeper cultural immersion. You'll return with memories to last a lifetime!",
                "suggestions": ["Multi-city tour", "Adventure + relaxation combo", "Cultural deep dive", "Nature & wildlife focus"],
                "confidence": 0.90
            }
        else:
            return {
                "response": "✈️ I'll craft the perfect travel plan tailored to your preferences! Whether it's a quick getaway or an extended journey, I'll ensure every moment is optimized for maximum enjoyment and discovery.",
                "suggestions": ["3-day weekend escape", "Week-long adventure", "Custom duration", "Multi-destination tour"],
                "confidence": 0.87
            }
    
    def booking_agent(self, message: str) -> Dict[str, Any]:
        """Handle bookings and reservations"""
        booking_options = [
            {
                "type": "flight",
                "option": "Air India Express",
                "price": "₹8,500",
                "details": "Delhi to Goa, 2h 30m direct flight",
                "availability": "Available"
            },
            {
                "type": "hotel",
                "option": "Taj Exotica Resort",
                "price": "₹12,000/night",
                "details": "5-star beachfront luxury resort",
                "availability": "Few rooms left"
            },
            {
                "type": "activity",
                "option": "Spice Plantation Tour",
                "price": "₹2,500",
                "details": "Full day guided tour with traditional lunch",
                "availability": "Available"
            }
        ]
        
        return {
            "response": "🎫 Fantastic! I found some excellent booking options with great prices and availability. All options include taxes and come with free cancellation for your peace of mind.",
            "suggestions": ["Compare all options", "Check detailed reviews", "Book now with discount", "Save for later"],
            "confidence": 0.91,
            "booking_options": booking_options
        }
    
    def trip_monitor_agent(self, message: str) -> Dict[str, Any]:
        """Real-time trip monitoring"""
        return {
            "response": "📱 All systems are monitoring your trip! Everything looks great - your flight is on time, weather is perfect, and all reservations are confirmed. I'll keep you updated on any changes.",
            "suggestions": ["Check flight status", "Weather updates", "Hotel confirmation", "Local alerts"],
            "confidence": 0.96
        }
    
    def day_of_agent(self, message: str) -> Dict[str, Any]:
        """Day-of travel assistance"""
        return {
            "response": "🚨 I'm here to help you right now! Whether you need directions, emergency assistance, or local recommendations, I've got you covered. Your safety and comfort are my top priorities.",
            "suggestions": ["Get directions", "Find nearby services", "Emergency contacts", "Local recommendations"],
            "confidence": 0.98
        }
    
    def process_message(self, message: str) -> Dict[str, Any]:
        """Process message through appropriate agent"""
        intent = self.detect_intent(message)
        agent_func = self.agents[intent]
        result = agent_func(message)
        result["agent"] = intent.title()
        return result

# Initialize the orchestrator
orchestrator = TravelAgentOrchestrator()

# Session management
sessions = {}

def get_session(session_id: str) -> Dict[str, Any]:
    if session_id not in sessions:
        sessions[session_id] = {
            "id": session_id,
            "created_at": datetime.now(),
            "messages": []
        }
    return sessions[session_id]

# --- API Endpoints ---

@app.get("/")
async def root():
    return {
        "message": "AI Travel Concierge Platform - Backend API",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "api": "running",
            "agents": "active",
            "sessions": len(sessions)
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Get session
        session = get_session(request.session_id)
        
        # Process through orchestrator
        result = orchestrator.process_message(request.message)
        
        # Store in session
        session["messages"].append({
            "user": request.message,
            "assistant": result["response"],
            "agent": result["agent"],
            "timestamp": datetime.now().isoformat()
        })
        
        return ChatResponse(
            response=result["response"],
            session_id=request.session_id,
            agent_used=result["agent"],
            confidence=result["confidence"],
            suggestions=result["suggestions"],
            booking_options=result.get("booking_options", [])
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.post("/api/image-search")
async def image_search(request: ImageSearchRequest):
    try:
        # Validate image data format
        if not request.image_data.startswith("data:image/"):
            raise ValueError("Invalid image format")
        
        # Simulate image analysis (in production, use Google Vision AI)
        results = {
            "identified_objects": ["landscape", "architecture", "nature", "tourism"],
            "scene_type": "travel_destination",
            "suggested_destinations": [
                {
                    "name": "Goa",
                    "similarity": 0.89,
                    "reason": "Coastal beauty with perfect beaches and vibrant culture"
                },
                {
                    "name": "Kerala",
                    "similarity": 0.76,
                    "reason": "Tropical paradise with lush landscapes and backwaters"
                },
                {
                    "name": "Rajasthan",
                    "similarity": 0.84,
                    "reason": "Royal heritage with magnificent architecture"
                }
            ],
            "activities": [
                "Beach relaxation",
                "Cultural exploration", 
                "Photography tours",
                "Local cuisine tasting",
                "Adventure activities"
            ],
            "best_time_to_visit": "October to March"
        }
        
        return {
            "success": True,
            "results": results,
            "session_id": request.session_id,
            "processing_time": "2.1 seconds"
        }
        
    except Exception as e:
        logger.error(f"Image search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@app.get("/api/destinations/popular")
async def get_popular_destinations():
    destinations = [
        {
            "id": "goa",
            "name": "Goa",
            "country": "India",
            "type": "Beach",
            "rating": 4.8,
            "price_range": "₹5,000-15,000",
            "image": "https://example.com/goa.jpg",
            "highlights": ["Beaches", "Nightlife", "Portuguese Heritage"]
        },
        {
            "id": "kerala",
            "name": "Kerala",
            "country": "India",
            "type": "Nature",
            "rating": 4.9,
            "price_range": "₹8,000-20,000",
            "image": "https://example.com/kerala.jpg",
            "highlights": ["Backwaters", "Hill Stations", "Ayurveda"]
        },
        {
            "id": "rajasthan",
            "name": "Rajasthan",
            "country": "India",
            "type": "Heritage",
            "rating": 4.7,
            "price_range": "₹6,000-18,000",
            "image": "https://example.com/rajasthan.jpg",
            "highlights": ["Palaces", "Desert", "Culture"]
        }
    ]
    
    return {"destinations": destinations}

@app.post("/api/booking")
async def create_booking(request: BookingRequest):
    try:
        booking_id = str(uuid.uuid4())
        booking = {
            "booking_id": booking_id,
            "type": request.booking_type,
            "details": request.details,
            "status": "confirmed",
            "created_at": datetime.now().isoformat(),
            "user_id": request.user_id,
            "session_id": request.session_id
        }
        
        return {
            "success": True,
            "booking": booking,
            "message": f"Booking confirmed! ID: {booking_id}"
        }
        
    except Exception as e:
        logger.error(f"Booking error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Booking failed: {str(e)}")

@app.get("/api/session/{session_id}")
async def get_session_info(session_id: str):
    session = get_session(session_id)
    return {
        "session_id": session_id,
        "created_at": session["created_at"].isoformat(),
        "message_count": len(session["messages"])
    }

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 AI Travel Concierge Platform starting up...")
    logger.info("✅ All agents initialized successfully")
    logger.info("✅ Session manager initialized")
    logger.info("✅ API endpoints ready")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
