#!/usr/bin/env python3
"""
Test script for frontend-backend integration
Tests the personalized AI system end-to-end
"""

import requests
import json
import time

def test_backend_endpoints():
    """Test all backend endpoints"""
    base_url = "http://localhost:8000"
    
    print("🔗 Testing Frontend-Backend Integration")
    print("=" * 50)
    
    # Test health endpoint
    print("\n1. Testing Health Endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health: {data['status']}")
            print(f"   Services: {data['services']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
    
    # Test personalized chat
    print("\n2. Testing Personalized Chat...")
    chat_data = {
        "message": "I want to visit Kerala for 7 days",
        "session_id": "test_session_123",
        "user_id": "test_user_456", 
        "context": {},
        "voice_input": False,
        "preferred_language": "en-US"
    }
    
    try:
        response = requests.post(f"{base_url}/api/personalized-chat", json=chat_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Personalized Chat: {data['agent_used']}")
            print(f"   Response: {data['response'][:100]}...")
            print(f"   Personalization Score: {data['personalization_score']}")
            print(f"   Suggestions: {len(data['suggestions'])} provided")
            print(f"   Booking Options: {len(data['booking_options'])} available")
        else:
            print(f"❌ Chat failed: {response.status_code}")
            print(f"   Error: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Chat error: {e}")
    
    # Test user profile update
    print("\n3. Testing User Profile Update...")
    profile_data = {
        "user_id": "test_user_456",
        "name": "Travel Enthusiast",
        "age_group": "26-35",
        "personality_type": "adventurous",
        "communication_style": "enthusiastic",
        "budget_range": "mid-range",
        "interests": ["adventure", "photography", "nature"],
        "preferred_language": "en-US",
        "voice_enabled": False
    }
    
    try:
        response = requests.post(f"{base_url}/api/user-profile", json=profile_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Profile Update: Success")
            print(f"   Personalization Score: {data['personalization_score']:.2f}")
            print(f"   Personality: {data['personality_type']}")
            print(f"   Style: {data['communication_style']}")
            print(f"   Interests: {data['interests']}")
        else:
            print(f"❌ Profile update failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Profile update error: {e}")
    
    # Test personalized chat after profile update
    print("\n4. Testing Personalized Chat After Profile Update...")
    chat_data2 = {
        "message": "Plan an adventurous photography trip to Himachal Pradesh",
        "session_id": "test_session_123",
        "user_id": "test_user_456",
        "context": {},
        "voice_input": False,
        "preferred_language": "en-US"
    }
    
    try:
        response = requests.post(f"{base_url}/api/personalized-chat", json=chat_data2)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Enhanced Chat: {data['agent_used']}")
            print(f"   Response: {data['response'][:150]}...")
            print(f"   Personalization Score: {data['personalization_score']:.2f}")
            print(f"   User Insights: {data.get('user_insights', {})}")
        else:
            print(f"❌ Enhanced chat failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Enhanced chat error: {e}")
    
    # Test feedback submission
    print("\n5. Testing Feedback System...")
    feedback_data = {
        "user_id": "test_user_456",
        "feedback_type": "rating",
        "feedback_data": {
            "rating": 5,
            "liked_suggestions": ["adventure activities", "photography spots"]
        },
        "response_id": "test_response_123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/user-feedback", json=feedback_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Feedback: Success")
            print(f"   Learning Insights: {len(data.get('learning_insights', {}))}")
            print(f"   Average Satisfaction: {data.get('average_satisfaction', 0):.1f}")
        else:
            print(f"❌ Feedback failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Feedback error: {e}")
    
    # Test user stats
    print("\n6. Testing User Stats...")
    try:
        response = requests.get(f"{base_url}/api/user-stats/test_user_456")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ User Stats: Success")
            print(f"   Profile Completeness: {data['profile_completeness']:.1%}")
            print(f"   Total Conversations: {data['total_conversations']}")
            print(f"   Interests Discovered: {data['interests_discovered']}")
            print(f"   Voice Enabled: {data['voice_enabled']}")
        else:
            print(f"❌ User stats failed: {response.status_code}")
    except Exception as e:
        print(f"❌ User stats error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Integration Test Complete!")
    print("\n🌐 Frontend URL: http://localhost:3003")
    print("🔧 Backend URL: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("\n✨ Features Available:")
    print("   • 12 personality types")
    print("   • 8 communication styles") 
    print("   • Persistent user memory")
    print("   • Destination intelligence")
    print("   • Real-time learning")
    print("   • Feedback system")
    print("   • Voice capabilities (install deps)")
    
    print("\n🧪 Next Steps:")
    print("   1. Open http://localhost:3003 in your browser")
    print("   2. Click 'Personalized AI Chat'")
    print("   3. Try different personality types")
    print("   4. Test with various destinations")
    print("   5. Give feedback and see learning in action")

if __name__ == "__main__":
    test_backend_endpoints()