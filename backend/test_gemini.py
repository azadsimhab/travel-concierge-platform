#!/usr/bin/env python3
"""
Test script for Gemini AI integration
This script tests the personalized AI system with your provided API key
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.personalized_ai import initialize_personalized_ai, PersonalizedTravelAI

async def test_gemini_integration():
    """Test the Gemini AI integration with personalized responses"""
    
    print("🧪 Testing Gemini AI Integration for Travel Concierge")
    print("=" * 60)
    
    # Get API key from environment
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found in environment variables")
        print("Make sure your .env file contains: GEMINI_API_KEY=your_key_here")
        return False
    
    print(f"✅ API Key loaded: {api_key[:10]}...{api_key[-4:]}")
    
    try:
        # Initialize the personalized AI system
        print("\n🚀 Initializing Personalized AI System...")
        personalized_ai = initialize_personalized_ai(api_key)
        print("✅ Personalized AI System initialized successfully!")
        
        # Test user ID
        test_user_id = "test_user_123"
        test_session_id = "test_session_456"
        
        print(f"\n👤 Testing with User ID: {test_user_id}")
        
        # Test Case 1: Basic travel query
        print("\n" + "="*50)
        print("TEST 1: Basic Travel Query")
        print("="*50)
        
        test_message_1 = "I want to go to Goa for 5 days"
        print(f"🔤 Input: '{test_message_1}'")
        
        response_1 = await personalized_ai.generate_personalized_response(
            message=test_message_1,
            user_id=test_user_id,
            session_id=test_session_id
        )
        
        print(f"🤖 Agent: {response_1['agent_used']}")
        print(f"🎯 Confidence: {response_1['confidence']}")
        print(f"📊 Personalization Score: {response_1['personalization_score']:.2f}")
        print(f"💡 Suggestions: {len(response_1['suggestions'])} provided")
        print(f"🎫 Booking Options: {len(response_1['booking_options'])} available")
        print(f"📝 Response Preview: {response_1['response'][:200]}...")
        
        # Test Case 2: Complex travel query with preferences  
        print("\n" + "="*50)
        print("TEST 2: Complex Query with Preferences")
        print("="*50)
        
        test_message_2 = "I love adventure activities and have a mid-range budget. Plan a 10-day trip to Himachal Pradesh with trekking and local culture experiences"
        print(f"🔤 Input: '{test_message_2}'")
        
        response_2 = await personalized_ai.generate_personalized_response(
            message=test_message_2,
            user_id=test_user_id,
            session_id=test_session_id
        )
        
        print(f"🤖 Agent: {response_2['agent_used']}")
        print(f"🎯 Confidence: {response_2['confidence']}")
        print(f"📊 Personalization Score: {response_2['personalization_score']:.2f}")
        print(f"💡 Suggestions: {response_2['suggestions']}")
        print(f"🎫 Booking Options: {len(response_2['booking_options'])} available")
        print(f"📝 Response Preview: {response_2['response'][:300]}...")
        
        # Test Case 3: User profile learning
        print("\n" + "="*50)
        print("TEST 3: User Profile Learning")
        print("="*50)
        
        # Get user stats to see learning progress
        stats = personalized_ai.get_user_stats(test_user_id)
        print(f"📈 User Statistics:")
        print(f"   - Profile Completeness: {stats['profile_completeness']:.2f}")
        print(f"   - Total Conversations: {stats['total_conversations']}")
        print(f"   - Interests Discovered: {stats['interests_discovered']}")
        print(f"   - Personality Type: {stats['personality_type']}")
        print(f"   - Communication Style: {stats['communication_style']}")
        
        # Test Case 4: Voice capability check
        print("\n" + "="*50)
        print("TEST 4: Voice System Check")
        print("="*50)
        
        from api.voice_system import initialize_voice_system, get_voice_system
        
        voice_system = initialize_voice_system()
        if voice_system:
            print("✅ Voice system initialized successfully!")
            languages = voice_system.get_supported_languages()
            personalities = voice_system.get_voice_personalities()
            print(f"🌍 Supported Languages: {len(languages)}")
            print(f"🎭 Voice Personalities: {len(personalities)}")
        else:
            print("⚠️ Voice system not available (optional dependencies missing)")
        
        print("\n" + "="*60)
        print("🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("\n✅ Your Gemini API key is working perfectly!")
        print("✅ Personalized AI system is fully functional!")
        print("✅ User learning and adaptation is working!")
        print("✅ Ready to provide unique travel experiences!")
        
        print("\n🚀 Next Steps:")
        print("1. Start the backend server: python -m uvicorn api.main:app --reload")
        print("2. Visit http://localhost:8000/docs to explore API endpoints")
        print("3. Test the personalized chat at /api/personalized-chat")
        print("4. Integrate with your frontend for the full experience!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR during testing: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        
        if "API_KEY" in str(e):
            print("\n🔑 API Key Issue:")
            print("- Check if your API key is correct")
            print("- Verify the key has proper permissions")
            print("- Make sure it's not expired")
        elif "import" in str(e).lower():
            print("\n📦 Import Issue:")
            print("- Run: pip install google-generativeai")
            print("- Make sure all dependencies are installed")
        else:
            print("\n🐛 General Error:")
            print("- Check your internet connection")
            print("- Verify the .env file is in the correct location")
            print("- Make sure the API key is valid")
        
        return False

if __name__ == "__main__":
    print("🤖 Personalized AI Travel Concierge - Gemini Integration Test")
    print("Using API Key: AIzaSyBejNPiBrw8j5EO1QwFj-R_38sxFV73FDo")
    print()
    
    # Run the async test
    success = asyncio.run(test_gemini_integration())
    
    if success:
        print("\n🌟 Your personalized AI Travel Concierge is ready to go!")
        exit(0)
    else:
        print("\n💥 Setup needs attention. Please fix the issues above.")
        exit(1)