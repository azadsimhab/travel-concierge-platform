from google.adk.agents import Agent
from google.adk.tools import Tool
from ..shared.tools import FlightBookingAPI, HotelBookingAPI, PaymentProcessor

class BookingAgent(Agent):
    def __init__(self):
        super().__init__(
            name="booking_agent",
            model="gemini-2.0-flash", 
            instruction="""You are a booking specialist handling travel reservations.
            
            Your expertise:
            - Flight booking and seat selection
            - Hotel reservations and room preferences
            - Activity and tour bookings
            - Payment processing and confirmation
            - Booking modifications and cancellations
            - Travel insurance recommendations
            
            Tools available:
            - flight_booking_api: Book flights and manage reservations
            - hotel_booking_api: Handle accommodation bookings
            - payment_processor: Secure payment handling
            
            Always provide:
            1. Clear booking confirmations with reference numbers
            2. Payment receipts and documentation
            3. Booking modification/cancellation policies
            4. Travel insurance options
            5. Pre-travel checklists and reminders""",
            
            tools=[
                FlightBookingAPI(),
                HotelBookingAPI(),
                PaymentProcessor()
            ]
        )

    async def process_booking(self, booking_request: dict) -> dict:
        """Handle travel booking requests"""
        
        booking_type = booking_request.get('type')  # flight, hotel, activity
        details = booking_request.get('details', {})
        payment_info = booking_request.get('payment', {})
        
        prompt = f"""
        Process booking request:
        
        Type: {booking_type}
        Details: {details}
        
        Steps:
        1. Validate booking details and availability
        2. Calculate total costs including taxes and fees
        3. Process secure payment
        4. Generate confirmation with reference numbers
        5. Provide booking documentation
        6. Set up automated reminders and notifications
        """
        
        response = await self.send_message(prompt)
        
        return {
            'booking_status': 'confirmed',
            'confirmation_number': self._generate_confirmation(),
            'booking_details': response.content,
            'payment_receipt': self._generate_receipt(payment_info),
            'next_steps': self._get_next_steps(booking_type)
        }

# Initialize the booking agent
booking_agent = BookingAgent() 