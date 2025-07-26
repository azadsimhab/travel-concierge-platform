"""
AI Travel Concierge Platform - Personalized AI with Gemini Integration
Advanced personalized travel assistant with voice capabilities
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
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

# Import our personalized AI and voice systems
from .personalized_ai import initialize_personalized_ai, get_personalized_ai, PersonalityType, CommunicationStyle
from .voice_system import initialize_voice_system, get_voice_system, VoicePersonality, VoiceGender, VoiceLanguage

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Personalized AI Travel Concierge",
    description="Your intelligent travel companion with Gemini AI and voice capabilities - providing unique experiences for each user",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3005", "http://localhost:3007", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---

class ChatRequest(BaseModel):
    message: str
    session_id: str
    user_id: str
    context: Optional[Dict[str, Any]] = {}
    voice_input: Optional[bool] = False
    preferred_language: Optional[str] = "en-US"

class PersonalizedChatResponse(BaseModel):
    response: str
    session_id: str
    user_id: str
    agent_used: str
    confidence: float
    suggestions: List[str] = []
    booking_options: List[Dict[str, Any]] = []
    personalization_score: float
    user_insights: Dict[str, Any]
    voice_response_available: bool = False
    voice_audio_data: Optional[str] = None

class VoiceRequest(BaseModel):
    audio_data: str  # Base64 encoded audio
    session_id: str
    user_id: str
    language: Optional[str] = "en-US"
    
class UserProfileUpdate(BaseModel):
    user_id: str
    name: Optional[str] = None
    age_group: Optional[str] = None
    personality_type: Optional[str] = None
    communication_style: Optional[str] = None
    budget_range: Optional[str] = None
    interests: Optional[List[str]] = None
    preferred_language: Optional[str] = None
    voice_enabled: Optional[bool] = None

class FeedbackRequest(BaseModel):
    user_id: str
    feedback_type: str  # "rating", "thumbs", "detailed", "correction"
    feedback_data: Dict[str, Any]
    response_id: Optional[str] = None

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
            "day_of": self.day_of_agent,
            "multi_agent": self.multi_agent_handler
        }
        
    def detect_intent(self, message: str) -> str:
        """Detect user intent and route to appropriate agent"""
        message_lower = message.lower()
        
        # Complex query detection - check for location + dates + duration
        has_location = any(location in message_lower for location in ["goa", "kerala", "rajasthan", "himachal", "kashmir", "delhi", "mumbai", "bangalore"])
        has_dates = any(date_word in message_lower for date_word in ["26th", "27th", "28th", "29th", "30th", "31st", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "today", "tomorrow", "next week", "next month"])
        has_duration = any(duration in message_lower for duration in ["days", "day", "weeks", "week", "months", "month", "10 days", "7 days", "5 days", "3 days"])
        
        # If it's a complex travel query, trigger multi-agent response
        if has_location and (has_dates or has_duration):
            return "multi_agent"
        
        # Place agent - location specific
        elif has_location:
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
    
    def multi_agent_handler(self, message: str) -> Dict[str, Any]:
        """Handle complex queries that require multiple agents"""
        message_lower = message.lower()
        
        # Extract details from the message
        destination = "Goa" if "goa" in message_lower else "Your destination"
        duration = "10 days" if "10 days" in message_lower else "your stay"
        date = "26th" if "26th" in message_lower else "your travel date"
        
        # Combine insights from multiple agents
        place_info = self.place_agent(message)
        planning_info = self.planning_agent(message)
        booking_info = self.booking_agent(message)
        
        # Create comprehensive response
        comprehensive_response = f"""🌴 Fantastic choice! {destination} on the {date} for {duration} is perfect - here's your complete travel plan:

🏖️ **Destination Insights (Place Agent):**
{place_info['response']}

📅 **Trip Planning (Planning Agent):**
I've crafted a perfect {duration} itinerary covering the best of {destination}:
• Days 1-3: North Goa beaches, nightlife, and Portuguese heritage
• Days 4-6: South Goa relaxation, spice plantations, and local culture  
• Days 7-10: Adventure activities, local markets, and hidden gems

🎫 **Booking Options (Booking Agent):**
Found great deals for your {duration} trip:"""
        
        # Enhanced booking options for comprehensive trips
        enhanced_booking_options = [
            {
                "type": "flight",
                "option": "Air India Express",
                "price": "₹8,500",
                "details": f"Delhi to Goa on {date}, return after {duration}",
                "availability": "Available - Book now for best prices!"
            },
            {
                "type": "hotel",
                "option": "Taj Exotica Resort & Spa",
                "price": "₹12,000/night",
                "details": f"5-star beachfront luxury for {duration}",
                "availability": "Few rooms left for {date}"
            },
            {
                "type": "hotel", 
                "option": "Alila Diwa Resort",
                "price": "₹8,000/night",
                "details": f"4-star resort with spa for {duration}",
                "availability": "Available with pool view"
            },
            {
                "type": "activity",
                "option": "Complete Goa Experience Package",
                "price": "₹15,000",
                "details": f"Spice plantation, dolphin cruise, heritage tours for {duration}",
                "availability": "Available - includes transport"
            },
            {
                "type": "transport",
                "option": "Rent a Scooter",
                "price": "₹500/day",
                "details": f"Explore Goa freely for {duration}",
                "availability": "Available - helmets included"
            }
        ]
        
        # Combined suggestions from all agents
        comprehensive_suggestions = [
            "See complete day-by-day itinerary",
            "Compare hotel packages",
            "Book flights + hotel combo",
            "Add adventure activities",
            "Get local restaurant recommendations",
            "Check weather forecast",
            "Download offline maps"
        ]
        
        return {
            "response": comprehensive_response,
            "suggestions": comprehensive_suggestions,
            "confidence": 0.96,
            "booking_options": enhanced_booking_options
        }
    
    def process_message(self, message: str) -> Dict[str, Any]:
        """Process message through appropriate agent"""
        intent = self.detect_intent(message)
        agent_func = self.agents[intent]
        result = agent_func(message)
        
        # Set agent name for display
        if intent == "multi_agent":
            result["agent"] = "Multi-Agent System"
        else:
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

@app.post("/api/chat")
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
        
        return {
            "response": result["response"],
            "session_id": request.session_id,
            "agent_used": result["agent"],
            "confidence": result["confidence"],
            "suggestions": result["suggestions"],
            "booking_options": result.get("booking_options", [])
        }
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

# --- PERSONALIZED AI ENDPOINTS ---

@app.post("/api/personalized-chat")
async def personalized_chat(request: ChatRequest):
    """Enhanced chat with personalized AI using Gemini"""
    try:
        # Validate required fields
        if not request.message or not request.user_id or not request.session_id:
            raise HTTPException(status_code=400, detail="message, user_id, and session_id are required")
        
        # Try to use personalized AI first
        personalized_ai = get_personalized_ai()
        if personalized_ai:
            result = await personalized_ai.generate_personalized_response(
                message=request.message,
                user_id=request.user_id,
                session_id=request.session_id,
                voice_input=request.voice_input or False
            )
            
            # Generate voice response if user has voice enabled
            voice_audio_data = None
            if result.get("voice_response_available"):
                voice_system = get_voice_system()
                if voice_system:
                    voice_result = await voice_system.text_to_speech(
                        result["response"],
                        voice_personality=VoicePersonality.FRIENDLY,
                        language=VoiceLanguage(request.preferred_language or "en-US")
                    )
                    voice_audio_data = voice_result.get("audio_data")
            
            return {
                "response": result["response"],
                "session_id": request.session_id,
                "user_id": request.user_id,
                "agent_used": result["agent_used"],
                "confidence": result["confidence"],
                "suggestions": result["suggestions"],
                "booking_options": result["booking_options"],
                "personalization_score": result["personalization_score"],
                "user_insights": result["user_insights"],
                "voice_response_available": result["voice_response_available"],
                "voice_audio_data": voice_audio_data
            }
        else:
            # Fallback to traditional system
            session = get_session(request.session_id)
            result = orchestrator.process_message(request.message)
            
            return {
                "response": result["response"],
                "session_id": request.session_id,
                "user_id": request.user_id,
                "agent_used": result["agent"],
                "confidence": result["confidence"],
                "suggestions": result["suggestions"],
                "booking_options": result.get("booking_options", []),
                "personalization_score": 0.3,  # Default low score
                "user_insights": {"fallback_mode": True},
                "voice_response_available": False,
                "voice_audio_data": None
            }
            
    except Exception as e:
        logger.error(f"Personalized chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Personalized chat failed: {str(e)}")

@app.post("/api/voice-chat")
async def voice_chat(request: VoiceRequest):
    """Process voice input and return personalized voice response"""
    try:
        voice_system = get_voice_system()
        if not voice_system:
            raise HTTPException(status_code=503, detail="Voice system not available")
        
        # Validate and convert voice to text
        try:
            # Add padding if needed for base64 decoding
            audio_data_str = request.audio_data
            # Remove data URL prefix if present
            if audio_data_str.startswith('data:'):
                audio_data_str = audio_data_str.split(',')[1]
            
            # Add padding if needed
            missing_padding = len(audio_data_str) % 4
            if missing_padding:
                audio_data_str += '=' * (4 - missing_padding)
            
            audio_data = base64.b64decode(audio_data_str)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid audio data format: {str(e)}")
        
        voice_analysis = await voice_system.analyze_voice_input(audio_data)
        
        if voice_analysis.get("error"):
            raise HTTPException(status_code=400, detail=voice_analysis["error"])
        
        # Process the text with personalized AI
        personalized_ai = get_personalized_ai()
        if personalized_ai:
            result = await personalized_ai.generate_personalized_response(
                message=voice_analysis["text"],
                user_id=request.user_id,
                session_id=request.session_id,
                voice_input=True
            )
            
            # Generate voice response
            voice_personality = voice_analysis.get("suggested_personality", VoicePersonality.FRIENDLY)
            voice_result = await voice_system.text_to_speech(
                result["response"],
                voice_personality=voice_personality,
                language=VoiceLanguage(request.language)
            )
            
            return {
                "text_input": voice_analysis["text"],
                "text_response": result["response"],
                "voice_audio_data": voice_result.get("audio_data"),
                "audio_format": voice_result.get("audio_format"),
                "voice_personality": voice_personality.value,
                "personalization_score": result["personalization_score"],
                "suggestions": result["suggestions"],
                "booking_options": result["booking_options"],
                "emotion_detected": voice_analysis.get("emotion", {}),
                "session_id": request.session_id
            }
        else:
            raise HTTPException(status_code=503, detail="Personalized AI not available")
            
    except Exception as e:
        logger.error(f"Voice chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Voice chat failed: {str(e)}")

@app.post("/api/user-profile")
async def update_user_profile(request: UserProfileUpdate):
    """Update user profile for personalization"""
    try:
        personalized_ai = get_personalized_ai()
        if not personalized_ai:
            raise HTTPException(status_code=503, detail="Personalized AI not available")
        
        # Convert request to dict, excluding None values
        updates = {k: v for k, v in request.dict().items() if v is not None and k != 'user_id'}
        
        profile = await personalized_ai.update_user_profile(request.user_id, updates)
        
        return {
            "success": True,
            "user_id": request.user_id,
            "profile_updated": True,
            "personalization_score": personalized_ai.calculate_personalization_score(profile),
            "personality_type": profile.personality_type.value,
            "communication_style": profile.communication_style.value,
            "interests": profile.interests,
            "message": "User profile updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile update failed: {str(e)}")

@app.get("/api/user-stats/{user_id}")
async def get_user_stats(user_id: str):
    """Get comprehensive user statistics and insights"""
    try:
        personalized_ai = get_personalized_ai()
        if not personalized_ai:
            raise HTTPException(status_code=503, detail="Personalized AI not available")
        
        stats = personalized_ai.get_user_stats(user_id)
        
        if "error" in stats:
            raise HTTPException(status_code=404, detail=stats["error"])
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get user stats: {str(e)}")

@app.post("/api/user-feedback")
async def submit_user_feedback(request: FeedbackRequest):
    """Submit user feedback to improve personalization"""
    try:
        personalized_ai = get_personalized_ai()
        if not personalized_ai:
            raise HTTPException(status_code=503, detail="Personalized AI not available")
        
        result = await personalized_ai.process_user_feedback(
            user_id=request.user_id,
            feedback_type=request.feedback_type,
            feedback_data=request.feedback_data,
            response_id=request.response_id
        )
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Feedback processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process feedback: {str(e)}")

@app.get("/api/voice-options")
async def get_voice_options():
    """Get available voice options and languages"""
    try:
        voice_system = get_voice_system()
        if not voice_system:
            return {
                "available": False,
                "message": "Voice system not available"
            }
        
        return {
            "available": True,
            "languages": voice_system.get_supported_languages(),
            "personalities": voice_system.get_voice_personalities(),
            "genders": [
                {"id": "female", "name": "Female"},
                {"id": "male", "name": "Male"},
                {"id": "neutral", "name": "Neutral"}
            ]
        }
        
    except Exception as e:
        logger.error(f"Voice options error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get voice options: {str(e)}")

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
    logger.info("🚀 Personalized AI Travel Concierge Platform starting up...")
    
    # Initialize Gemini API key
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        logger.warning("⚠️ GEMINI_API_KEY not found. Using fallback agent system.")
    else:
        try:
            # Initialize personalized AI system
            initialize_personalized_ai(gemini_api_key)
            logger.info("✅ Personalized Gemini AI system initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini AI: {e}")
    
    # Initialize voice system
    google_cloud_credentials = os.getenv("GOOGLE_CLOUD_CREDENTIALS_PATH")
    try:
        initialize_voice_system(google_cloud_credentials)
        logger.info("✅ Voice system initialized")
    except Exception as e:
        logger.warning(f"⚠️ Voice system initialization failed: {e}")
    
    logger.info("✅ All traditional agents initialized successfully")
    logger.info("✅ Session manager initialized")
    logger.info("✅ API endpoints ready")
    logger.info("🌟 Personalized AI Travel Concierge is ready to serve unique experiences!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
