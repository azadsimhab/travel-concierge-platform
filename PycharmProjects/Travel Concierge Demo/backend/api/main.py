from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import asyncio
from datetime import datetime

# Import agents
from ..agents.root.agent import travel_concierge_root
from ..shared.config import settings

app = FastAPI(
    title="Travel Concierge AI API",
    description="Google ADK-powered travel assistant backend",
    version="1.0.0"
)

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:3007"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    session_id: str
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = {}

class SearchRequest(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = {}
    user_preferences: Optional[Dict[str, Any]] = {}

class BookingRequest(BaseModel):
    type: str  # flight, hotel, activity
    details: Dict[str, Any]
    user_id: str
    payment_info: Optional[Dict[str, Any]] = {}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

# API Routes
@app.get("/")
async def root():
    return {"message": "Travel Concierge AI Backend", "status": "running"}

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    """Main chat endpoint - routes to appropriate agents"""
    try:
        # Process request through root agent
        response = await travel_concierge_root.process_travel_request({
            'message': request.message,
            'session_id': request.session_id,
            'context': request.context
        })
        
        return {
            'success': True,
            'response': response['response'],
            'agent_used': response['agent_used'],
            'suggestions': response.get('actions', []),
            'session_id': request.session_id,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.post("/api/search")
async def search_destinations(request: SearchRequest):
    """Search for destinations and travel options"""
    try:
        # Create a search-specific request for the inspiration agent
        search_response = await travel_concierge_root.process_travel_request({
            'message': f"Find destinations for: {request.query}",
            'session_id': f"search_{datetime.utcnow().timestamp()}",
            'context': {
                'search_query': request.query,
                'filters': request.filters,
                'preferences': request.user_preferences
            }
        })
        
        return {
            'success': True,
            'query': request.query,
            'recommendations': search_response['response'],
            'agent_used': search_response['agent_used']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/api/planning/itinerary")
async def create_itinerary(trip_details: Dict[str, Any]):
    """Create detailed travel itinerary"""
    try:
        # Format trip details for planning agent
        planning_message = f"""
        Create a detailed itinerary for:
        Destination: {trip_details.get('destination', 'Not specified')}
        Duration: {trip_details.get('duration', 'Not specified')} days
        Budget: {trip_details.get('budget', 'Not specified')}
        Interests: {', '.join(trip_details.get('interests', []))}
        Travel Dates: {trip_details.get('dates', 'Flexible')}
        Group Size: {trip_details.get('group_size', 1)} people
        """
        
        itinerary_response = await travel_concierge_root.process_travel_request({
            'message': planning_message,
            'session_id': f"planning_{datetime.utcnow().timestamp()}",
            'context': {'trip_details': trip_details}
        })
        
        return {
            'success': True,
            'itinerary': itinerary_response['response'],
            'trip_details': trip_details,
            'suggestions': itinerary_response.get('actions', [])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Itinerary creation failed: {str(e)}")

@app.get("/api/destinations/popular")
async def get_popular_destinations():
    """Get popular travel destinations"""
    try:
        # Mock popular destinations data (replace with real database query)
        destinations = [
            {
                "id": "goa",
                "name": "Goa",
                "country": "India",
                "emoji": "🏖️",
                "rating": 4.5,
                "reviews": "12,456",
                "description": "Beautiful beaches and vibrant nightlife",
                "image_url": "/images/goa.jpg",
                "price_range": "₹2,000-5,000/day"
            },
            {
                "id": "hyderabad", 
                "name": "Hyderabad",
                "country": "India",
                "emoji": "🏛️",
                "rating": 4.3,
                "reviews": "8,234", 
                "description": "Historic city with amazing biryani",
                "image_url": "/images/hyderabad.jpg",
                "price_range": "₹1,500-3,500/day"
            },
            {
                "id": "kerala",
                "name": "Kerala", 
                "country": "India",
                "emoji": "🌴",
                "rating": 4.6,
                "reviews": "15,678",
                "description": "Backwaters and lush hill stations",
                "image_url": "/images/kerala.jpg", 
                "price_range": "₹2,500-4,500/day"
            },
            {
                "id": "rajasthan",
                "name": "Rajasthan",
                "country": "India", 
                "emoji": "🏰",
                "rating": 4.4,
                "reviews": "11,543",
                "description": "Royal palaces and golden desert",
                "image_url": "/images/rajasthan.jpg",
                "price_range": "₹2,000-6,000/day"
            }
        ]
        
        return {
            'success': True,
            'destinations': destinations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch destinations: {str(e)}")

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket for real-time chat with AI agents"""
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive message from frontend
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Process through AI agents
            response = await travel_concierge_root.process_travel_request(message_data)
            
            # Send response back to frontend
            await manager.send_personal_message(json.dumps({
                'type': 'ai_response',
                'data': response,
                'timestamp': datetime.utcnow().isoformat()
            }), websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        await manager.send_personal_message(json.dumps({
            'type': 'error',
            'message': f"Error: {str(e)}"
        }), websocket)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Travel Concierge AI Backend"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT, reload=settings.DEBUG) 