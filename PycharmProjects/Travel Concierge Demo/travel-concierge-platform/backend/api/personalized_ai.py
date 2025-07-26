"""
Personalized AI Travel Concierge with Gemini Integration
Advanced AI system providing unique, personalized experiences for each user
"""

import google.generativeai as genai
import json
import uuid
import os
import pickle
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
import logging
from fastapi import HTTPException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PersonalityType(Enum):
    ADVENTUROUS = "adventurous"
    LUXURY = "luxury"
    BUDGET = "budget"
    CULTURAL = "cultural"
    RELAXED = "relaxed"
    FAMILY = "family"
    BUSINESS = "business"
    FOODIE = "foodie"
    PHOTOGRAPHER = "photographer"
    WELLNESS = "wellness"
    BACKPACKER = "backpacker"
    ROMANTIC = "romantic"

class CommunicationStyle(Enum):
    FORMAL = "formal"
    CASUAL = "casual"
    ENTHUSIASTIC = "enthusiastic"
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    HUMOROUS = "humorous"
    DETAILED = "detailed"
    CONCISE = "concise"

@dataclass
class UserProfile:
    user_id: str
    name: Optional[str] = None
    age_group: Optional[str] = None  # "18-25", "26-35", "36-50", "50+"
    personality_type: PersonalityType = PersonalityType.ADVENTUROUS
    communication_style: CommunicationStyle = CommunicationStyle.FRIENDLY
    budget_range: Optional[str] = None  # "budget", "mid-range", "luxury"
    interests: List[str] = None
    travel_history: List[Dict] = None
    preferences: Dict[str, Any] = None
    conversation_history: List[Dict] = None
    last_interaction: Optional[datetime] = None
    preferred_language: str = "en"
    voice_enabled: bool = False
    accessibility_needs: List[str] = None
    feedback_history: List[Dict] = None
    satisfaction_scores: List[float] = None
    learning_insights: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.interests is None:
            self.interests = []
        if self.travel_history is None:
            self.travel_history = []
        if self.preferences is None:
            self.preferences = {}
        if self.conversation_history is None:
            self.conversation_history = []
        if self.accessibility_needs is None:
            self.accessibility_needs = []
        if self.feedback_history is None:
            self.feedback_history = []
        if self.satisfaction_scores is None:
            self.satisfaction_scores = []
        if self.learning_insights is None:
            self.learning_insights = {}

class PersonalizedTravelAI:
    def __init__(self, gemini_api_key: str):
        """Initialize the Personalized AI system with Gemini"""
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.user_profiles: Dict[str, UserProfile] = {}
        self.conversation_contexts: Dict[str, List[Dict]] = {}
        self.data_dir = "user_data"
        self._ensure_data_directory()
        self._load_user_profiles()
    
    def _ensure_data_directory(self):
        """Ensure the user data directory exists"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
            logger.info(f"Created user data directory: {self.data_dir}")
    
    def _load_user_profiles(self):
        """Load user profiles from persistent storage"""
        try:
            profiles_file = os.path.join(self.data_dir, "user_profiles.pkl")
            if os.path.exists(profiles_file):
                with open(profiles_file, 'rb') as f:
                    self.user_profiles = pickle.load(f)
                logger.info(f"Loaded {len(self.user_profiles)} user profiles from storage")
            else:
                logger.info("No existing user profiles found, starting fresh")
        except Exception as e:
            logger.error(f"Error loading user profiles: {e}")
            self.user_profiles = {}
    
    def _save_user_profiles(self):
        """Save user profiles to persistent storage"""
        try:
            profiles_file = os.path.join(self.data_dir, "user_profiles.pkl")
            with open(profiles_file, 'wb') as f:
                pickle.dump(self.user_profiles, f)
            logger.debug(f"Saved {len(self.user_profiles)} user profiles to storage")
        except Exception as e:
            logger.error(f"Error saving user profiles: {e}")
    
    def _save_user_profile(self, user_id: str):
        """Save a single user profile"""
        try:
            user_file = os.path.join(self.data_dir, f"user_{user_id}.json")
            if user_id in self.user_profiles:
                profile_dict = asdict(self.user_profiles[user_id])
                # Convert datetime to string for JSON serialization
                if profile_dict.get('last_interaction'):
                    profile_dict['last_interaction'] = profile_dict['last_interaction'].isoformat()
                
                with open(user_file, 'w') as f:
                    json.dump(profile_dict, f, indent=2, default=str)
                logger.debug(f"Saved profile for user {user_id}")
        except Exception as e:
            logger.error(f"Error saving user profile {user_id}: {e}")
        
    async def get_or_create_user_profile(self, user_id: str, initial_data: Dict = None) -> UserProfile:
        """Get existing user profile or create a new one"""
        if user_id not in self.user_profiles:
            profile_data = initial_data or {}
            self.user_profiles[user_id] = UserProfile(
                user_id=user_id,
                name=profile_data.get('name'),
                age_group=profile_data.get('age_group'),
                personality_type=PersonalityType(profile_data.get('personality_type', 'adventurous')),
                communication_style=CommunicationStyle(profile_data.get('communication_style', 'friendly')),
                budget_range=profile_data.get('budget_range'),
                interests=profile_data.get('interests', []),
                preferred_language=profile_data.get('preferred_language', 'en'),
                voice_enabled=profile_data.get('voice_enabled', False)
            )
            logger.info(f"Created new user profile for {user_id}")
        
        return self.user_profiles[user_id]
    
    def analyze_user_intent_and_personality(self, message: str, user_profile: UserProfile) -> Dict[str, Any]:
        """Analyze user message to understand intent and adjust personality"""
        
        # Update conversation history
        user_profile.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "type": "user"
        })
        
        # Keep only last 10 conversations for context
        if len(user_profile.conversation_history) > 20:
            user_profile.conversation_history = user_profile.conversation_history[-20:]
        
        # Analyze patterns to update personality and preferences
        message_lower = message.lower()
        
        # Update interests based on message content
        interest_keywords = {
            "adventure": ["adventure", "hiking", "trekking", "extreme", "thrill", "adrenaline", "climbing", "rafting"],
            "luxury": ["luxury", "5-star", "premium", "spa", "resort", "fine dining", "exclusive", "VIP"],
            "culture": ["culture", "history", "museum", "heritage", "traditional", "art", "architecture", "monument"],
            "food": ["food", "cuisine", "restaurant", "local food", "street food", "cooking", "taste", "flavor"],
            "nightlife": ["nightlife", "party", "club", "bar", "entertainment", "dance", "music", "drinks"],
            "nature": ["nature", "wildlife", "safari", "beach", "mountain", "forest", "lake", "river"],
            "photography": ["photography", "photos", "instagram", "scenic", "camera", "shoot", "capture", "golden hour"],
            "family": ["family", "kids", "children", "family-friendly", "playground", "educational", "safe"],
            "wellness": ["wellness", "yoga", "meditation", "spa", "massage", "detox", "health", "fitness"],
            "backpacking": ["backpack", "hostel", "budget travel", "local", "authentic", "independence", "solo"],
            "romance": ["romantic", "couple", "honeymoon", "sunset", "intimate", "cozy", "together", "love"],
            "business": ["business", "conference", "meeting", "networking", "work", "corporate", "professional"]
        }
        
        for interest, keywords in interest_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                if interest not in user_profile.interests:
                    user_profile.interests.append(interest)
        
        # Detect budget preferences
        if any(word in message_lower for word in ["budget", "cheap", "affordable", "low cost"]):
            user_profile.budget_range = "budget"
        elif any(word in message_lower for word in ["luxury", "premium", "expensive", "high-end"]):
            user_profile.budget_range = "luxury"
        elif any(word in message_lower for word in ["mid-range", "moderate", "reasonable"]):
            user_profile.budget_range = "mid-range"
        
        # Detect communication style preferences
        if any(word in message_lower for word in ["please", "kindly", "would you", "could you"]):
            user_profile.communication_style = CommunicationStyle.FORMAL
        elif any(word in message_lower for word in ["awesome", "cool", "amazing", "wow"]):
            user_profile.communication_style = CommunicationStyle.ENTHUSIASTIC
        
        return {
            "updated_interests": user_profile.interests,
            "budget_preference": user_profile.budget_range,
            "communication_style": user_profile.communication_style.value
        }
    
    def build_personalized_prompt(self, message: str, user_profile: UserProfile, context: str = "") -> str:
        """Build a personalized prompt for Gemini based on user profile"""
        
        # Build personality context
        personality_traits = {
            PersonalityType.ADVENTUROUS: "love adventure, seeking thrilling experiences, outdoor activities, extreme sports",
            PersonalityType.LUXURY: "prefer premium experiences, high-end accommodations, exclusive services, fine dining",
            PersonalityType.BUDGET: "value-conscious, looking for great deals, budget-friendly options, smart spending",
            PersonalityType.CULTURAL: "interested in history, art, local culture, authentic experiences, museums",
            PersonalityType.RELAXED: "prefer peaceful, calm experiences, wellness-focused travel, slow travel",
            PersonalityType.FAMILY: "traveling with family, need child-friendly options, safety-focused, educational",
            PersonalityType.BUSINESS: "efficient travel, business-focused, time-conscious, networking opportunities",
            PersonalityType.FOODIE: "passionate about local cuisine, street food, cooking classes, food tours",
            PersonalityType.PHOTOGRAPHER: "seeking Instagram-worthy spots, golden hour lighting, unique perspectives",
            PersonalityType.WELLNESS: "focused on health, spa treatments, yoga retreats, meditation, detox",
            PersonalityType.BACKPACKER: "independent travel, hostels, meeting locals, off-beaten-path experiences",
            PersonalityType.ROMANTIC: "couple travel, sunset views, intimate dining, romantic getaways"
        }
        
        communication_styles = {
            CommunicationStyle.FORMAL: "professional and polite tone, detailed explanations, proper grammar",
            CommunicationStyle.CASUAL: "friendly and conversational, use casual language, relaxed tone",
            CommunicationStyle.ENTHUSIASTIC: "energetic and exciting tone, use enthusiasm, lots of exclamation marks",
            CommunicationStyle.PROFESSIONAL: "business-like, efficient, straight to the point, time-conscious",
            CommunicationStyle.FRIENDLY: "warm and helpful, like talking to a friend, personal touch",
            CommunicationStyle.HUMOROUS: "light-hearted, witty, use appropriate humor and jokes",
            CommunicationStyle.DETAILED: "comprehensive information, thorough explanations, extensive details",
            CommunicationStyle.CONCISE: "brief and to the point, essential information only, no fluff"
        }
        
        # Recent conversation context
        recent_conversations = user_profile.conversation_history[-5:] if user_profile.conversation_history else []
        conversation_context = "\n".join([
            f"User: {conv['message']}" for conv in recent_conversations if conv['type'] == 'user'
        ])
        
        prompt = f"""
You are an expert AI Travel Concierge providing personalized travel assistance. Here's what you know about this user:

USER PROFILE:
- Name: {user_profile.name or 'Valued Traveler'}
- Age Group: {user_profile.age_group or 'Not specified'}
- Personality Type: {personality_traits.get(user_profile.personality_type, 'General traveler')}
- Budget Preference: {user_profile.budget_range or 'Flexible'}
- Interests: {', '.join(user_profile.interests) if user_profile.interests else 'Discovering new interests'}
- Communication Style: {communication_styles.get(user_profile.communication_style, 'Friendly and helpful')}
- Language: {user_profile.preferred_language}

RECENT CONVERSATION CONTEXT:
{conversation_context}

TRAVEL HISTORY:
{json.dumps(user_profile.travel_history[-3:], indent=2) if user_profile.travel_history else 'First-time user'}

CURRENT REQUEST: {message}

INSTRUCTIONS:
1. Respond in a {user_profile.communication_style.value} tone that matches their personality
2. Consider their {user_profile.personality_type.value} personality and {user_profile.budget_range or 'flexible budget'} preferences
3. Reference their interests: {', '.join(user_profile.interests) if user_profile.interests else 'general travel'}
4. Provide 3-5 highly personalized suggestions based on their profile
5. Include specific details like pricing, timing, and booking options
6. Make the response feel uniquely tailored to them
7. If they mentioned locations, provide insider tips and personalized recommendations
8. Always end with follow-up questions to learn more about their preferences

{context}

Provide a comprehensive, personalized response that makes this user feel like they have their own personal travel expert who knows them well.
"""
        
        return prompt
    
    async def generate_personalized_response(
        self, 
        message: str, 
        user_id: str, 
        session_id: str,
        voice_input: bool = False
    ) -> Dict[str, Any]:
        """Generate a personalized response using Gemini AI"""
        
        try:
            # Get or create user profile
            user_profile = await self.get_or_create_user_profile(user_id)
            
            # Analyze and update user profile
            analysis = self.analyze_user_intent_and_personality(message, user_profile)
            
            # Get destination-specific intelligence
            destination_intel = self.get_destination_intelligence(message)
            
            # Build personalized prompt with destination intelligence
            context = ""
            if destination_intel["has_specific_data"]:
                dest_data = destination_intel["intelligence"]
                personality_recommendations = dest_data["personality_matches"].get(
                    user_profile.personality_type.value, []
                )
                
                context = f"""
DESTINATION INTELLIGENCE FOR {destination_intel["destination"].upper()}:
- Best time to visit: {dest_data["best_time"]}
- Signature experiences: {', '.join(dest_data["signature_experiences"][:3])}
- Hidden gems: {', '.join(dest_data["hidden_gems"][:2])}
- Personality matches for {user_profile.personality_type.value}: {', '.join(personality_recommendations)}
- Local tips: {', '.join(dest_data["local_tips"][:2])}

Use this specific destination intelligence to provide highly accurate and locally relevant recommendations.
"""
            
            prompt = self.build_personalized_prompt(message, user_profile, context)
            
            # Generate response with Gemini
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=800,  # Reduced for Flash model efficiency
                    top_p=0.9,
                )
            )
            
            ai_response = response.text
            
            # Update conversation history
            user_profile.conversation_history.append({
                "timestamp": datetime.now().isoformat(),
                "message": ai_response,
                "type": "ai",
                "personalization_used": analysis
            })
            
            user_profile.last_interaction = datetime.now()
            
            # Save updated profile
            self._save_user_profile(user_id)
            self._save_user_profiles()
            
            # Generate personalized suggestions
            suggestions = self.generate_personalized_suggestions(user_profile, message)
            
            # Generate booking options based on profile
            booking_options = self.generate_personalized_bookings(user_profile, message)
            
            return {
                "response": ai_response,
                "agent_used": "Personalized Gemini AI",
                "confidence": 0.95,
                "suggestions": suggestions,
                "booking_options": booking_options,
                "personalization_score": self.calculate_personalization_score(user_profile),
                "user_insights": analysis,
                "voice_response_available": user_profile.voice_enabled,
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"Error generating personalized response: {str(e)}")
            
            # Handle quota exceeded gracefully
            if "429" in str(e) or "quota" in str(e).lower():
                logger.warning("Gemini API quota exceeded, using fallback response")
                
                # Provide a fallback response with some personalización
                fallback_response = self._generate_fallback_response(message, user_profile)
                suggestions = self.generate_personalized_suggestions(user_profile, message)
                booking_options = self.generate_personalized_bookings(user_profile, message)
                
                return {
                    "response": fallback_response,
                    "agent_used": "Personalized Fallback Agent",
                    "confidence": 0.7,
                    "suggestions": suggestions,
                    "booking_options": booking_options,
                    "personalization_score": self.calculate_personalization_score(user_profile),
                    "user_insights": {"fallback_mode": True, "reason": "API quota exceeded"},
                    "voice_response_available": user_profile.voice_enabled,
                    "session_id": session_id
                }
            else:
                raise HTTPException(status_code=500, detail=f"AI response generation failed: {str(e)}")
    
    def _generate_fallback_response(self, message: str, user_profile: UserProfile) -> str:
        """Generate a personalized fallback response using travel intelligence when Gemini is not available"""
        
        message_lower = message.lower()
        name = user_profile.name or "valued traveler"
        
        # Detect destination and get intelligence
        destination_intel = self.get_destination_intelligence(message)
        destination = destination_intel["destination"].title()
        has_intel = destination_intel["has_specific_data"]
        
        # Multi-agent approach inspired by Google travel concierge
        agent_persona = self._select_travel_agent_persona(user_profile, message_lower)
        
        # Generate human-like, agent-specific response
        if agent_persona == "inspiration":
            response = f"✨ **Travel Inspiration Agent here!** ✨\n\nHey {name}! I'm absolutely excited to help you discover the magic of {destination}! "
        elif agent_persona == "planning":
            response = f"📋 **Travel Planning Agent at your service!** 📋\n\nHi {name}! Let's turn your {destination} dreams into a concrete plan! "
        elif agent_persona == "luxury":
            response = f"💎 **Luxury Travel Specialist here!** 💎\n\nWelcome {name}! I specialize in creating extraordinary {destination} experiences that exceed expectations. "
        elif agent_persona == "adventure":
            response = f"🏔️ **Adventure Travel Expert ready!** 🏔️\n\nHey there {name}! Ready for some epic {destination} adventures? "
        elif agent_persona == "cultural":
            response = f"🏛️ **Cultural Experience Curator here!** 🏛️\n\nGreetings {name}! Let me unveil the rich cultural tapestry of {destination} for you. "
        else:
            response = f"🌟 **Your Personal Travel Concierge!** 🌟\n\nHello {name}! I'm here to craft the perfect {destination} experience just for you! "
        
        # Add destination-specific intelligence if available
        if has_intel:
            intel = destination_intel["intelligence"]
            
            # Add signature experiences
            if intel.get("signature_experiences"):
                top_experiences = intel["signature_experiences"][:3]
                response += f"\n\n🌟 **Must-Experience in {destination}:**\n"
                for i, exp in enumerate(top_experiences, 1):
                    response += f"   {i}. {exp}\n"
            
            # Add personality-matched recommendations
            personality_matches = intel.get("personality_matches", {}).get(user_profile.personality_type.value, [])
            if personality_matches:
                response += f"\n🎯 **Perfect for your {user_profile.personality_type.value} personality:**\n"
                for match in personality_matches[:2]:
                    response += f"   • {match}\n"
            
            # Add local insider tips
            if intel.get("local_tips"):
                response += f"\n💡 **Insider Tips:**\n"
                response += f"   • {intel['local_tips'][0]}\n"
                if len(intel['local_tips']) > 1:
                    response += f"   • {intel['local_tips'][1]}\n"
            
            # Add best time to visit
            if intel.get("best_time"):
                response += f"\n📅 **Best Time to Visit:** {intel['best_time']}\n"
        
        # Add personalized touch based on user profile
        response += f"\n💫 **Why I'm perfect for you:**\n"
        response += f"   • I remember you're a {user_profile.personality_type.value} traveler\n"
        response += f"   • Your {user_profile.communication_style.value} communication style guides my responses\n"
        
        if user_profile.budget_range:
            response += f"   • I focus on {user_profile.budget_range} options that match your preferences\n"
        
        if user_profile.interests:
            interests_text = ", ".join(user_profile.interests[:3])
            response += f"   • I know you love: {interests_text}\n"
        
        # Add conversation continuity
        response += f"\n🔄 **Let's continue planning!** I'm learning about your preferences with every conversation. "
        response += f"The more we chat, the better I become at creating your perfect {destination} experience!"
        
        # Add next steps
        response += f"\n\n💬 **What would you like to know next?**\n"
        response += f"   • Detailed itinerary planning\n"
        response += f"   • Specific accommodation recommendations\n"
        response += f"   • Local dining and entertainment\n"
        response += f"   • Transportation and logistics\n"
        
        return response
    
    def _select_travel_agent_persona(self, user_profile: UserProfile, message_lower: str) -> str:
        """Select appropriate travel agent persona based on user profile and message"""
        
        # Check message intent first
        if any(word in message_lower for word in ["inspire", "suggest", "idea", "where", "destination"]):
            return "inspiration"
        elif any(word in message_lower for word in ["plan", "itinerary", "schedule", "organize"]):
            return "planning"
        elif any(word in message_lower for word in ["luxury", "premium", "5-star", "exclusive"]):
            return "luxury"
        elif any(word in message_lower for word in ["adventure", "thrill", "extreme", "outdoor"]):
            return "adventure"
        elif any(word in message_lower for word in ["culture", "history", "heritage", "traditional"]):
            return "cultural"
        
        # Fallback to personality type
        if user_profile.personality_type == PersonalityType.LUXURY:
            return "luxury"
        elif user_profile.personality_type == PersonalityType.ADVENTUROUS:
            return "adventure"
        elif user_profile.personality_type == PersonalityType.CULTURAL:
            return "cultural"
        else:
            return "general"
    
    def generate_personalized_suggestions(self, user_profile: UserProfile, message: str) -> List[str]:
        """Generate highly personalized follow-up suggestions"""
        
        base_suggestions = []
        
        # Based on personality type
        if user_profile.personality_type == PersonalityType.ADVENTUROUS:
            base_suggestions.extend([
                "Show me adventure activities in this destination",
                "Find unique off-the-beaten-path experiences",
                "What are the most thrilling things to do here?"
            ])
        elif user_profile.personality_type == PersonalityType.LUXURY:
            base_suggestions.extend([
                "Show premium resort options",
                "Find exclusive experiences and VIP services", 
                "What are the most luxurious restaurants here?"
            ])
        elif user_profile.personality_type == PersonalityType.CULTURAL:
            base_suggestions.extend([
                "Explore local culture and traditions",
                "Find historical sites and museums",
                "What authentic local experiences are available?"
            ])
        
        # Based on interests
        if "food" in user_profile.interests:
            base_suggestions.append("Discover the best local cuisine and food tours")
        if "photography" in user_profile.interests:
            base_suggestions.append("Find the most Instagram-worthy spots")
        if "nature" in user_profile.interests:
            base_suggestions.append("Explore natural attractions and wildlife")
        
        # Add personalized suggestions based on message content
        message_lower = message.lower()
        if "days" in message_lower:
            base_suggestions.append("Create a detailed day-by-day itinerary")
        if any(month in message_lower for month in ["january", "february", "march", "april", "may", "june"]):
            base_suggestions.append("Check weather and seasonal highlights")
        
        # Limit to 7 most relevant suggestions
        return base_suggestions[:7]
    
    def generate_personalized_bookings(self, user_profile: UserProfile, message: str) -> List[Dict[str, Any]]:
        """Generate personalized booking options"""
        
        bookings = []
        
        # Adjust options based on budget preference
        if user_profile.budget_range == "luxury":
            bookings.extend([
                {
                    "type": "flight",
                    "option": "Business Class - Air India",
                    "price": "₹25,000",
                    "details": "Premium service with lounge access",
                    "availability": "Available - Limited seats",
                    "personalization": "Selected for your luxury preferences"
                },
                {
                    "type": "hotel",
                    "option": "5-Star Resort & Spa",
                    "price": "₹18,000/night",
                    "details": "Premium oceanview suite with spa access",
                    "availability": "Available - Book now for best rates",
                    "personalization": "Matches your luxury travel style"
                }
            ])
        elif user_profile.budget_range == "budget":
            bookings.extend([
                {
                    "type": "flight",
                    "option": "IndiGo - Economy",
                    "price": "₹6,500",
                    "details": "Direct flight with good timing",
                    "availability": "Great deal - Limited time",
                    "personalization": "Best value for your budget"
                },
                {
                    "type": "hotel",
                    "option": "Boutique Guesthouse",
                    "price": "₹3,500/night",
                    "details": "Clean, comfortable with local charm",
                    "availability": "Available - Highly rated",
                    "personalization": "Perfect budget option with character"
                }
            ])
        else:  # mid-range or default
            bookings.extend([
                {
                    "type": "flight",
                    "option": "Vistara - Premium Economy",
                    "price": "₹12,000",
                    "details": "Comfortable flight with good service",
                    "availability": "Available - Good timing",
                    "personalization": "Great balance of comfort and value"
                },
                {
                    "type": "hotel",
                    "option": "4-Star Beach Resort",
                    "price": "₹8,500/night",
                    "details": "Beachfront location with modern amenities",
                    "availability": "Available - Sea view rooms",
                    "personalization": "Ideal for your travel style"
                }
            ])
        
        # Add activity based on interests
        if "adventure" in user_profile.interests:
            bookings.append({
                "type": "activity",
                "option": "Adventure Sports Package",
                "price": "₹4,500",
                "details": "Paragliding, water sports, and trekking",
                "availability": "Available - Adventure guaranteed",
                "personalization": "Perfect for your adventurous spirit"
            })
        elif "culture" in user_profile.interests:
            bookings.append({
                "type": "activity", 
                "option": "Cultural Heritage Tour",
                "price": "₹2,800",
                "details": "Guided tour of historical sites and local culture",
                "availability": "Available - Expert local guides",
                "personalization": "Tailored for culture enthusiasts"
            })
        
        return bookings[:5]  # Limit to 5 options
    
    def calculate_personalization_score(self, user_profile: UserProfile) -> float:
        """Calculate how well we know this user (0-1 score)"""
        score = 0.0
        
        # Basic profile completeness
        if user_profile.name: score += 0.1
        if user_profile.age_group: score += 0.1
        if user_profile.budget_range: score += 0.15
        
        # Interests and preferences  
        score += min(len(user_profile.interests) * 0.05, 0.2)
        score += min(len(user_profile.travel_history) * 0.03, 0.15)
        
        # Conversation history
        score += min(len(user_profile.conversation_history) * 0.01, 0.2)
        
        # Recent activity
        if user_profile.last_interaction:
            days_since = (datetime.now() - user_profile.last_interaction).days
            if days_since < 7: score += 0.1
        
        return min(score, 1.0)
    
    async def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> UserProfile:
        """Update user profile with new information"""
        if user_id not in self.user_profiles:
            await self.get_or_create_user_profile(user_id, updates)
        else:
            profile = self.user_profiles[user_id]
            
            # Update fields
            for key, value in updates.items():
                if hasattr(profile, key):
                    if key == 'interests' and isinstance(value, list):
                        # Merge interests without duplicates
                        profile.interests = list(set(profile.interests + value))
                    elif key == 'travel_history' and isinstance(value, list):
                        profile.travel_history.extend(value)
                    elif key == 'personality_type' and isinstance(value, str):
                        # Convert string to enum
                        try:
                            profile.personality_type = PersonalityType(value)
                        except ValueError:
                            logger.warning(f"Invalid personality type: {value}")
                    elif key == 'communication_style' and isinstance(value, str):
                        # Convert string to enum
                        try:
                            profile.communication_style = CommunicationStyle(value)
                        except ValueError:
                            logger.warning(f"Invalid communication style: {value}")
                    else:
                        setattr(profile, key, value)
        
        # Save updated profile
        self._save_user_profile(user_id)
        self._save_user_profiles()
        
        return self.user_profiles[user_id]
    
    def get_destination_intelligence(self, message: str) -> Dict[str, Any]:
        """Get destination-specific intelligence and recommendations"""
        message_lower = message.lower()
        
        destination_intelligence = {
            "goa": {
                "best_time": "November to March",
                "weather_now": "Pleasant and sunny",
                "signature_experiences": [
                    "Beach hopping in North Goa",
                    "Portuguese heritage tour in Old Goa", 
                    "Spice plantation visits",
                    "Sunset cruises on Mandovi River",
                    "Night markets in Anjuna"
                ],
                "hidden_gems": [
                    "Butterfly Beach accessible only by boat",
                    "Chorla Ghats waterfalls",
                    "Divar Island bicycle tours",
                    "Traditional Goan cooking classes"
                ],
                "personality_matches": {
                    "adventurous": ["Parasailing at Calangute", "Scuba diving at Grande Island"],
                    "luxury": ["Park Hyatt Goa Resort", "Taj Exotica Goa"],
                    "cultural": ["Basilica of Bom Jesus", "Goa State Museum"],
                    "foodie": ["Beach shacks for seafood", "Feni tasting tours"],
                    "romantic": ["Sunset at Chapora Fort", "Candlelight dinner on beach"]
                },
                "local_tips": [
                    "Rent a scooter for easy transportation",
                    "Try Goan fish curry and rice",
                    "Bargain at local markets",
                    "Respect local customs at religious sites"
                ]
            },
            "kerala": {
                "best_time": "October to March",
                "weather_now": "Cool and comfortable",
                "signature_experiences": [
                    "Houseboat cruise in Alleppey backwaters",
                    "Tea plantation tours in Munnar",
                    "Ayurveda treatments in Kovalam",
                    "Kathakali dance performances",
                    "Wildlife safari in Thekkady"
                ],
                "hidden_gems": [
                    "Varkala cliff beaches",
                    "Chinese fishing nets in Fort Kochi",
                    "Bamboo rafting in Periyar",
                    "Village stay in Kumarakom"
                ],
                "personality_matches": {
                    "wellness": ["Ayurveda retreats", "Yoga centers in Rishikesh"],
                    "nature": ["Periyar Wildlife Sanctuary", "Silent Valley National Park"],
                    "luxury": ["Kumarakom Lake Resort", "Taj Malabar Resort"],
                    "cultural": ["Jewish Synagogue in Kochi", "Mattancherry Palace"],
                    "romantic": ["Houseboat honeymoon", "Hill station retreats"]
                },
                "local_tips": [
                    "Book houseboats in advance",
                    "Try Kerala sadya (traditional meal)",
                    "Carry light cotton clothes",
                    "Learn basic Malayalam phrases"
                ]
            },
            "chennai": {
                "best_time": "November to February",
                "weather_now": "Hot and humid",
                "signature_experiences": [
                    "Marina Beach sunrise walks",
                    "Kapaleeshwarar Temple visits",
                    "Classical music concerts in December",
                    "Traditional South Indian breakfast tours",
                    "Government Museum explorations"
                ],
                "hidden_gems": [
                    "Crocodile Bank conservation center",
                    "DakshinaChitra cultural village",
                    "Pulicat Lake bird sanctuary",
                    "Mahabalipuram stone carvings day trip"
                ],
                "personality_matches": {
                    "cultural": ["Bharatanatyam performances", "Temple architecture tours"],
                    "foodie": ["Chettinad cuisine", "Filter coffee culture"],
                    "business": ["IT corridor networking", "Conference venues"],
                    "family": ["Birla Planetarium", "Guindy National Park"],
                    "photographer": ["Marina Beach sunsets", "Colonial architecture"]
                },
                "local_tips": [
                    "Use Chennai Metro for easy travel",
                    "Try authentic Tamil meals on banana leaf",
                    "Respect temple dress codes",
                    "Learn a few Tamil greetings"
                ]
            }
        }
        
        # Detect destination from message
        detected_destination = None
        for dest in destination_intelligence.keys():
            if dest in message_lower:
                detected_destination = dest
                break
        
        if detected_destination:
            return {
                "destination": detected_destination,
                "intelligence": destination_intelligence[detected_destination],
                "has_specific_data": True
            }
        else:
            return {
                "destination": "general",
                "intelligence": {},
                "has_specific_data": False
            }
    
    async def process_user_feedback(
        self, 
        user_id: str, 
        feedback_type: str, 
        feedback_data: Dict[str, Any],
        response_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process user feedback to improve personalization"""
        
        if user_id not in self.user_profiles:
            return {"error": "User not found"}
        
        profile = self.user_profiles[user_id]
        
        # Create feedback entry
        feedback_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": feedback_type,  # "rating", "thumbs", "detailed", "correction"
            "data": feedback_data,
            "response_id": response_id
        }
        
        profile.feedback_history.append(feedback_entry)
        
        # Process different types of feedback
        if feedback_type == "rating":
            # User rated the response 1-5
            rating = float(feedback_data.get("rating", 3))
            profile.satisfaction_scores.append(rating)
            
            # Adjust personality detection based on rating
            if rating >= 4:
                # Positive feedback - reinforce current personality assessment
                self._reinforce_positive_patterns(profile, feedback_data)
            elif rating <= 2:
                # Negative feedback - adjust approach
                self._adjust_for_negative_feedback(profile, feedback_data)
        
        elif feedback_type == "thumbs":
            # Simple thumbs up/down
            thumbs = feedback_data.get("thumbs")  # "up" or "down"
            rating = 4.0 if thumbs == "up" else 2.0
            profile.satisfaction_scores.append(rating)
            
        elif feedback_type == "detailed":
            # Detailed written feedback
            self._process_detailed_feedback(profile, feedback_data)
            
        elif feedback_type == "correction":
            # User corrects a recommendation
            self._process_correction_feedback(profile, feedback_data)
        
        # Update learning insights
        self._update_learning_insights(profile)
        
        # Save profile
        self._save_user_profile(user_id)
        
        return {
            "success": True,
            "feedback_processed": True,
            "learning_insights": profile.learning_insights,
            "average_satisfaction": sum(profile.satisfaction_scores[-10:]) / len(profile.satisfaction_scores[-10:]) if profile.satisfaction_scores else 3.0
        }
    
    def _reinforce_positive_patterns(self, profile: UserProfile, feedback_data: Dict):
        """Reinforce patterns that led to positive feedback"""
        
        # If user liked adventure recommendations, strengthen adventure personality
        if "liked_suggestions" in feedback_data:
            liked_suggestions = feedback_data["liked_suggestions"]
            
            for suggestion in liked_suggestions:
                suggestion_lower = suggestion.lower()
                
                # Reinforce interests
                if "adventure" in suggestion_lower and "adventure" not in profile.interests:
                    profile.interests.append("adventure")
                elif "luxury" in suggestion_lower and "luxury" not in profile.interests:
                    profile.interests.append("luxury")
                elif "culture" in suggestion_lower and "culture" not in profile.interests:
                    profile.interests.append("culture")
        
        # Store successful patterns
        if "successful_patterns" not in profile.learning_insights:
            profile.learning_insights["successful_patterns"] = []
        
        profile.learning_insights["successful_patterns"].append({
            "timestamp": datetime.now().isoformat(),
            "personality_type": profile.personality_type.value,
            "communication_style": profile.communication_style.value,
            "interests": profile.interests.copy(),
            "feedback": feedback_data
        })
    
    def _adjust_for_negative_feedback(self, profile: UserProfile, feedback_data: Dict):
        """Adjust approach based on negative feedback"""
        
        # If user didn't like the communication style, try to adjust
        if "disliked_tone" in feedback_data:
            disliked_tone = feedback_data["disliked_tone"]
            
            # Adjust communication style
            if disliked_tone == "too_casual" and profile.communication_style == CommunicationStyle.CASUAL:
                profile.communication_style = CommunicationStyle.PROFESSIONAL
            elif disliked_tone == "too_formal" and profile.communication_style == CommunicationStyle.FORMAL:
                profile.communication_style = CommunicationStyle.FRIENDLY
            elif disliked_tone == "too_enthusiastic":
                profile.communication_style = CommunicationStyle.PROFESSIONAL
        
        # Store unsuccessful patterns to avoid
        if "unsuccessful_patterns" not in profile.learning_insights:
            profile.learning_insights["unsuccessful_patterns"] = []
        
        profile.learning_insights["unsuccessful_patterns"].append({
            "timestamp": datetime.now().isoformat(),
            "personality_type": profile.personality_type.value,
            "communication_style": profile.communication_style.value,
            "feedback": feedback_data
        })
    
    def _process_detailed_feedback(self, profile: UserProfile, feedback_data: Dict):
        """Process detailed written feedback"""
        
        feedback_text = feedback_data.get("feedback_text", "").lower()
        
        # Extract insights from detailed feedback
        insights = {}
        
        # Check for personality indicators
        if any(word in feedback_text for word in ["too expensive", "costly", "price"]):
            if profile.budget_range != "budget":
                profile.budget_range = "budget"
                insights["budget_adjusted"] = "Changed to budget-conscious based on feedback"
        
        elif any(word in feedback_text for word in ["luxurious", "premium", "high-end"]):
            if profile.budget_range != "luxury":
                profile.budget_range = "luxury"
                insights["budget_adjusted"] = "Changed to luxury based on feedback"
        
        # Check for interest updates
        if "boring" in feedback_text or "not interested" in feedback_text:
            # Try to detect what they found boring and adjust
            for interest in profile.interests.copy():
                if interest in feedback_text:
                    profile.interests.remove(interest)
                    insights[f"removed_interest"] = interest
        
        profile.learning_insights.update(insights)
    
    def _process_correction_feedback(self, profile: UserProfile, feedback_data: Dict):
        """Process user corrections to recommendations"""
        
        original_suggestion = feedback_data.get("original_suggestion", "")
        corrected_suggestion = feedback_data.get("corrected_suggestion", "")
        
        # Learn from the correction
        correction_insight = {
            "timestamp": datetime.now().isoformat(),
            "original": original_suggestion,
            "corrected": corrected_suggestion,
            "learned_preference": self._extract_preference_from_correction(original_suggestion, corrected_suggestion)
        }
        
        if "corrections" not in profile.learning_insights:
            profile.learning_insights["corrections"] = []
        
        profile.learning_insights["corrections"].append(correction_insight)
    
    def _extract_preference_from_correction(self, original: str, corrected: str) -> str:
        """Extract user preference from their correction"""
        
        original_lower = original.lower()
        corrected_lower = corrected.lower()
        
        # Simple pattern matching
        if "budget" in corrected_lower and "luxury" in original_lower:
            return "prefers_budget_over_luxury"
        elif "luxury" in corrected_lower and "budget" in original_lower:
            return "prefers_luxury_over_budget"
        elif "adventure" in corrected_lower:
            return "prefers_adventure_activities"
        elif "cultural" in corrected_lower:
            return "prefers_cultural_experiences"
        else:
            return "preference_learned_from_correction"
    
    def _update_learning_insights(self, profile: UserProfile):
        """Update overall learning insights for the user"""
        
        # Calculate satisfaction trend
        if profile.satisfaction_scores:
            recent_scores = profile.satisfaction_scores[-5:]
            profile.learning_insights["satisfaction_trend"] = {
                "average": sum(recent_scores) / len(recent_scores),
                "improving": len(recent_scores) >= 2 and recent_scores[-1] > recent_scores[0],
                "total_feedback_count": len(profile.satisfaction_scores)
            }
        
        # Track learning milestones
        if len(profile.feedback_history) % 10 == 0 and len(profile.feedback_history) > 0:
            profile.learning_insights["milestone"] = {
                "feedback_count": len(profile.feedback_history),
                "reached_at": datetime.now().isoformat(),
                "personalization_score": self.calculate_personalization_score(profile)
            }
    
    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user statistics and insights"""
        if user_id not in self.user_profiles:
            return {"error": "User not found"}
        
        profile = self.user_profiles[user_id]
        
        return {
            "user_id": user_id,
            "profile_completeness": self.calculate_personalization_score(profile),
            "total_conversations": len(profile.conversation_history),
            "interests_discovered": len(profile.interests),
            "trips_planned": len(profile.travel_history),
            "last_interaction": profile.last_interaction.isoformat() if profile.last_interaction else None,
            "personality_type": profile.personality_type.value,
            "communication_style": profile.communication_style.value,
            "voice_enabled": profile.voice_enabled
        }

# Initialize the personalized AI system
personalized_ai = None

def initialize_personalized_ai(gemini_api_key: str):
    """Initialize the global personalized AI instance"""
    global personalized_ai
    personalized_ai = PersonalizedTravelAI(gemini_api_key)
    return personalized_ai

def get_personalized_ai() -> PersonalizedTravelAI:
    """Get the global personalized AI instance"""
    if personalized_ai is None:
        raise HTTPException(status_code=500, detail="Personalized AI not initialized")
    return personalized_ai