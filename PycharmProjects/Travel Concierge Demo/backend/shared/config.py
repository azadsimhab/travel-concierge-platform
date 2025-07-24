import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime

load_dotenv()

class Settings:
    # Google Cloud
    GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    # API Keys
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    
    # Database
    FIRESTORE_DATABASE = os.getenv("FIRESTORE_DATABASE", "travel-concierge")
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # Frontend
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3007")

settings = Settings() 

app = FastAPI(
    title="Travel Concierge AI API",
    description="AI-powered travel assistant backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3007"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = {}

def generate_ai_response(message: str) -> str:
    if 'goa' in message.lower():
        return "🏖️ Goa is a fantastic destination! Best time: Oct-Mar. Top spots: Baga Beach, Fort Aguada, Anjuna. Budget: ₹3,000-5,000/day. Want a detailed itinerary?"
    return "👋 Welcome! Ask me about any destination, trip planning, or bookings."

@app.get("/")
async def root():
    return {"message": "Travel Concierge AI Backend", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Travel Concierge AI Backend"
    }

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        ai_response = generate_ai_response(request.message)
        return {
            'success': True,
            'response': ai_response,
            'agent_used': 'travel_assistant',
            'suggestions': ["Get detailed itinerary", "Check prices", "Find hotels"],
            'session_id': request.session_id,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.get("/api/destinations/popular")
async def get_popular_destinations():
    destinations = [
        {"id": "goa", "name": "Goa", "country": "India", "emoji": "🏖️", "rating": 4.5, "reviews": "12,456", "description": "Beautiful beaches and vibrant nightlife", "price_range": "₹2,000-5,000/day"},
        {"id": "hyderabad", "name": "Hyderabad", "country": "India", "emoji": "🏛️", "rating": 4.3, "reviews": "8,234", "description": "Historic city with amazing biryani", "price_range": "₹1,500-3,500/day"},
        {"id": "kerala", "name": "Kerala", "country": "India", "emoji": "🌴", "rating": 4.6, "reviews": "15,678", "description": "Backwaters and lush hill stations", "price_range": "₹2,500-4,500/day"},
        {"id": "rajasthan", "name": "Rajasthan", "country": "India", "emoji": "🏰", "rating": 4.4, "reviews": "11,543", "description": "Royal palaces and golden desert", "price_range": "₹2,000-6,000/day"}
    ]
    return {'success': True, 'destinations': destinations}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 