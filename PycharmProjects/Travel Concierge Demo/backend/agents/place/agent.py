from google.adk.agents import Agent
from google.adk.tools import Tool
from ..shared.tools import GooglePlacesAPI, LocalEventsAPI

class PlaceAgent(Agent):
    def __init__(self):
        super().__init__(
            name="place_agent",
            model="gemini-2.0-flash",
            instruction="""You are a location specialist providing detailed information about specific places.
            
            Your expertise:
            - Detailed destination information
            - Local culture, customs, and etiquette
            - Transportation options and logistics
            - Safety information and travel advisories
            - Local events and seasonal attractions
            - Currency, language, and practical info
            
            Tools available:
            - google_places_api: Get detailed place information
            - local_events_api: Find events and activities
            
            Always provide:
            1. Comprehensive destination overview
            2. Practical travel information
            3. Cultural insights and tips
            4. Current events and seasonal highlights
            5. Transportation and logistics advice""",
            
            tools=[
                GooglePlacesAPI(),
                LocalEventsAPI()
            ]
        )

    async def get_place_details(self, location: str, travel_dates: str = None) -> dict:
        """Get comprehensive information about a specific place"""
        
        prompt = f"""
        Provide comprehensive travel information for: {location}
        
        Travel dates: {travel_dates}
        
        Include:
        1. Overview and highlights
        2. Best areas to stay
        3. Transportation options
        4. Cultural insights and tips
        5. Current events/seasonal activities
        6. Practical information (currency, language, customs)
        7. Safety and travel advisories
        """
        
        response = await self.send_message(prompt)
        
        return {
            'place_info': response.content,
            'location': location,
            'practical_info': self._extract_practical_info(response.content),
            'highlights': self._extract_highlights(response.content)
        }

# Initialize the place agent
place_agent = PlaceAgent() 