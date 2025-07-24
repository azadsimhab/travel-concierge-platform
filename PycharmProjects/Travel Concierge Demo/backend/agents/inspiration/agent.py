from google.adk.agents import Agent
from google.adk.tools import Tool, ToolContext
from ..shared.tools import GoogleMapsSearch, WeatherAPI

class InspirationAgent(Agent):
    def __init__(self):
        super().__init__(
            name="inspiration_agent",
            model="gemini-2.0-flash",
            instruction="""You are a travel inspiration specialist.
            
            Your expertise:
            - Suggesting destinations based on preferences, budget, dates
            - Understanding travel styles (adventure, relaxation, culture, etc.)
            - Seasonal recommendations and best times to visit
            - Budget-appropriate suggestions
            - Hidden gems and unique experiences
            
            Tools available:
            - google_maps_search: Find destinations and get location info
            - weather_api: Check weather patterns and best travel times
            
            Always provide:
            1. 3-5 specific destination recommendations
            2. Why each destination fits their criteria
            3. Best time to visit
            4. Approximate budget ranges
            5. Unique highlights for each place""",
            
            tools=[
                GoogleMapsSearch(),
                WeatherAPI()
            ]
        )

    async def get_destination_inspiration(self, preferences: dict) -> dict:
        """Generate travel destination recommendations"""
        
        # Extract user preferences
        budget = preferences.get('budget', 'moderate')
        interests = preferences.get('interests', [])
        travel_style = preferences.get('style', 'mixed')
        dates = preferences.get('dates', None)
        origin = preferences.get('origin', 'India')
        
        # Create context-rich prompt
        prompt = f"""
        Generate travel destination recommendations for:
        
        Budget: {budget}
        Interests: {', '.join(interests)}
        Travel Style: {travel_style}
        Preferred Dates: {dates}
        Starting from: {origin}
        
        Provide specific, actionable recommendations with reasoning.
        """
        
        response = await self.send_message(prompt)
        
        return {
            'recommendations': response.content,
            'destinations': self._extract_destinations(response.content),
            'reasoning': self._extract_reasoning(response.content)
        }

    def _extract_destinations(self, content: str) -> list:
        """Extract destination names from response"""
        # Implementation to parse destination names
        pass
    
    def _extract_reasoning(self, content: str) -> dict:
        """Extract reasoning for each recommendation"""
        # Implementation to parse reasoning
        pass

# Initialize the inspiration agent
inspiration_agent = InspirationAgent() 