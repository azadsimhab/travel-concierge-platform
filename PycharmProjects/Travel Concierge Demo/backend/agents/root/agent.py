from google.adk.agents import Agent
from typing import Dict, Any
import asyncio

class TravelConciergeRoot(Agent):
    def __init__(self):
        super().__init__(
            name="travel_concierge_root",
            model="gemini-2.0-flash",
            instruction="""You are the main orchestrator for a travel concierge system.
            
            Your role is to:
            1. Understand user travel requests and intent
            2. Route requests to appropriate specialized agents
            3. Coordinate responses from multiple agents
            4. Provide coherent, helpful travel assistance
            
            Available specialized agents:
            - inspiration: For travel ideas and destination discovery
            - place: For location-specific information
            - planning: For itinerary creation and optimization
            - booking: For reservations and payments
            
            Always be helpful, accurate, and provide specific actionable travel advice.
            Include relevant emojis and format responses clearly.""",
        )
        
        # Agent routing logic
        self.agent_keywords = {
            'inspiration': ['inspire', 'idea', 'suggestion', 'where', 'destination', 'explore'],
            'place': ['about', 'information', 'culture', 'weather', 'local', 'area'],
            'planning': ['plan', 'itinerary', 'schedule', 'trip', 'day', 'activity'],
            'booking': ['book', 'reserve', 'payment', 'hotel', 'flight', 'confirm']
        }

    async def process_travel_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming travel requests and route to appropriate agents"""
        user_message = request.get('message', '').lower()
        session_id = request.get('session_id', '')
        context = request.get('context', {})
        
        # Determine which agent to use based on message content
        target_agent = self._determine_agent(user_message)
        
        # Generate response using Gemini
        response = await self._generate_response(user_message, target_agent, context)
        
        return {
            'response': response,
            'agent_used': target_agent,
            'session_id': session_id,
            'actions': self._suggest_actions(user_message, target_agent)
        }
    
    def _determine_agent(self, message: str) -> str:
        """Determine which specialized agent should handle the request"""
        for agent, keywords in self.agent_keywords.items():
            if any(keyword in message for keyword in keywords):
                return agent
        return 'inspiration'  # Default to inspiration agent
    
    async def _generate_response(self, message: str, agent: str, context: Dict) -> str:
        """Generate AI response based on the target agent"""
        
        # Enhanced prompts based on agent type
        if agent == 'inspiration':
            prompt = f"""As a travel inspiration specialist, respond to: \"{message}\"\n\nProvide:\n- 3-5 specific destination recommendations\n- Why each destination fits their needs\n- Best time to visit\n- Approximate budget ranges\n- Unique highlights\n\nBe enthusiastic and inspiring while being practical."""
        
        elif agent == 'place':
            prompt = f"""As a destination expert, respond to: \"{message}\"\n\nProvide detailed information about:\n- Local culture and customs\n- Weather and best travel times\n- Transportation options\n- Safety information\n- Currency and practical tips\n\nBe informative and helpful."""
        
        elif agent == 'planning':
            prompt = f"""As a trip planning specialist, respond to: \"{message}\"\n\nCreate detailed plans including:\n- Day-by-day itinerary suggestions\n- Time management and logistics\n- Activity recommendations\n- Restaurant suggestions\n- Transportation between locations\n\nBe organized and thorough."""
        
        elif agent == 'booking':
            prompt = f"""As a booking specialist, respond to: \"{message}\"\n\nProvide information about:\n- Booking procedures and requirements\n- Price estimates and payment options\n- Cancellation policies\n- Best booking timing\n- Special offers or discounts\n\nBe clear and trustworthy."""
        
        else:
            prompt = f"""As a helpful travel assistant, respond to: \"{message}\"\n\nProvide comprehensive travel assistance."""
        
        # Use Gemini to generate response
        response = await self.send_message(prompt)
        return response.content if hasattr(response, 'content') else str(response)
    
    def _suggest_actions(self, message: str, agent: str) -> list:
        """Suggest follow-up actions based on the conversation"""
        actions = []
        
        if agent == 'inspiration':
            actions = [
                "Get detailed information about a destination",
                "Create a trip itinerary", 
                "Check flight and hotel prices"
            ]
        elif agent == 'planning':
            actions = [
                "Book recommended hotels",
                "Find flights for your dates",
                "Add activities to your plan"
            ]
        elif agent == 'booking':
            actions = [
                "Proceed with booking",
                "Check cancellation policy",
                "Add travel insurance"
            ]
        
        return actions

# Initialize the root agent
travel_concierge_root = TravelConciergeRoot() 