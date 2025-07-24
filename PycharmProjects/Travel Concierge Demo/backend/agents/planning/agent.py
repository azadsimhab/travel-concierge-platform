from google.adk.agents import Agent
from google.adk.tools import Tool
from ..shared.tools import FlightSearchAPI, HotelSearchAPI, ActivityBookingAPI

class PlanningAgent(Agent):
    def __init__(self):
        super().__init__(
            name="planning_agent", 
            model="gemini-2.0-flash",
            instruction="""You are an expert trip planning specialist.
            
            Your expertise:
            - Creating detailed day-by-day itineraries
            - Optimizing routes and schedules
            - Balancing must-see attractions with rest time
            - Budget optimization and cost estimation
            - Transportation planning between destinations
            - Restaurant and dining recommendations
            
            Tools available:
            - flight_search_api: Find and compare flights
            - hotel_search_api: Search accommodations
            - activity_booking_api: Find activities and tours
            
            Always provide:
            1. Day-by-day detailed itinerary
            2. Cost breakdown with estimates
            3. Transportation between locations
            4. Restaurant recommendations for each day
            5. Booking priorities and timing advice
            6. Alternative options for weather/preferences""",
            
            tools=[
                FlightSearchAPI(),
                HotelSearchAPI(), 
                ActivityBookingAPI()
            ]
        )

    async def create_itinerary(self, trip_details: dict) -> dict:
        """Create a comprehensive travel itinerary"""
        
        destination = trip_details.get('destination')
        duration = trip_details.get('duration')
        budget = trip_details.get('budget')
        interests = trip_details.get('interests', [])
        dates = trip_details.get('dates')
        group_size = trip_details.get('group_size', 1)
        
        prompt = f"""
        Create a detailed travel itinerary for:
        
        Destination: {destination}
        Duration: {duration} days
        Budget: {budget}
        Interests: {', '.join(interests)}
        Travel Dates: {dates}
        Group Size: {group_size}
        
        Provide:
        1. Day-by-day schedule with timing
        2. Accommodation recommendations with price ranges
        3. Restaurant suggestions for each meal
        4. Transportation between locations
        5. Activity costs and booking information
        6. Total estimated costs breakdown
        7. Packing suggestions based on activities
        """
        
        response = await self.send_message(prompt)
        
        return {
            'itinerary': response.content,
            'daily_schedule': self._parse_daily_schedule(response.content),
            'cost_estimate': self._extract_cost_breakdown(response.content),
            'bookings_needed': self._identify_bookings(response.content)
        }

# Initialize the planning agent
planning_agent = PlanningAgent() 